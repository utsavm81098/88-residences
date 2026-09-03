import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { subscribeGLB, clearGLBCache } from "@/hooks/use-glb-loader";
import { disposeThreeScene } from "@/utils/preloader";
import { logger } from "@/utils/logger";

// This app mounts exactly one Home scene at a time (a permanently-mounted
// singleton toggled by `visible`, per containers/scene-canvas — see
// use-home-scene.js's own doc comments on `hasBeenActive`), so a module-
// scope reference to "the" merged group is safe, and lets external reset
// code (use-home.js's handleResetCache) reach it without having to thread a
// ref down through props. Mirrors the module-scope `cache` Map pattern
// use-glb-loader.js already uses for the same reason.
let activeGroup = null;
let activeManifest = null;

// Order each tier's content reveals in, once that tier's single download
// has arrived. Matches the `revealGroup` tag scripts/generate-tier-
// bundles.js writes into every top-level node's glTF `extras` (GLTFLoader
// copies this into THREE.Object3D.userData automatically — verified
// against this project's exact three.js version, node_modules/three/
// examples/jsm/loaders/GLTFLoader.js's assignExtrasToUserData). This is a
// purely VISUAL staggered reveal, not a network/file split: each tier is
// still one fast Draco-compressed download (see generate-tier-bundles.js's
// own doc comment for why splitting into per-category files was tried and
// reverted — it made things slower, not faster, due to cross-file
// duplication). Spreading the reveal across a few frames also spreads
// first-time shader compilation for each group's materials across those
// same frames, instead of one potentially-janky frame compiling
// everything's shaders at once.
const TIER1_REVEAL_GROUP_ORDER = [
  "ground_surface",
  "building_a",
  "building_b",
  "building_c",
  "building_d",
  "building_e",
  "building_f",
  "building_g",
];
const TIER2_REVEAL_GROUP_ORDER = ["trees_vegetation", "amenities_pools"];
const REVEAL_STAGGER_MS = 60;

/**
 * Splits a tier's just-arrived top-level nodes by their `revealGroup` tag,
 * makes the first group visible immediately, and staggers the rest in over
 * groupOrder.length * REVEAL_STAGGER_MS. All nodes are added to `group`
 * (and thus tuned/matrix-updated) together, regardless of reveal timing —
 * only `.visible` is staggered, not the merge/tuning itself.
 *
 * IMPORTANT: callers must not treat "tier data arrived" as "tier fully
 * visible" — e.g. features/building-markers/index.jsx renders all 7 A-G
 * markers from FIXED positions the instant it mounts, independent of each
 * building's actual mesh visibility (confirmed: it has no per-building
 * visibility gate of its own). Mounting BuildingMarkers before tier-1's
 * staggered reveal finishes would show markers floating over buildings
 * that haven't appeared yet. onFullyRevealed (called once, after the LAST
 * group turns visible) exists specifically so callers can gate anything
 * position-dependent on the reveal being ACTUALLY complete, not just
 * started — see use-home-scene.js's tier1FullyRevealed/tier2FullyRevealed.
 *
 * @param {import('three').Object3D[]} nodes
 * @param {string[]} groupOrder
 * @param {() => boolean} isCancelled
 * @param {() => void} onFullyRevealed
 * @returns {() => void} cleanup — clears any pending reveal timers
 */
const scheduleStaggeredReveal = (nodes, groupOrder, isCancelled, onFullyRevealed) => {
  const byGroup = new Map();
  const untagged = [];
  nodes.forEach((node) => {
    const group = node.userData?.revealGroup;
    if (!group) {
      untagged.push(node);
      return;
    }
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(node);
  });

  const orderedGroups = groupOrder.map((name) => byGroup.get(name) || []);
  // Any node without a recognized tag (shouldn't happen — every node is
  // tagged at build time — but fail safe rather than fail hidden) reveals
  // immediately alongside the first group, never silently stays invisible.
  orderedGroups[0] = [...orderedGroups[0], ...untagged];

  orderedGroups.forEach((groupNodes, index) => {
    if (index === 0) {
      groupNodes.forEach((node) => {
        node.visible = true;
      });
      return;
    }
    groupNodes.forEach((node) => {
      node.visible = false;
    });
  });

  if (orderedGroups.length <= 1) {
    onFullyRevealed();
    return () => {};
  }

  const timers = orderedGroups.slice(1).map((groupNodes, i) => {
    const isLast = i === orderedGroups.length - 2;
    return setTimeout(
      () => {
        if (isCancelled()) return;
        groupNodes.forEach((node) => {
          node.visible = true;
        });
        if (isLast) onFullyRevealed();
      },
      (i + 1) * REVEAL_STAGGER_MS,
    );
  });

  return () => timers.forEach(clearTimeout);
};

/**
 * Orchestrates progressive loading of the Home masterplan scene from a tier
 * manifest ({ tier1: string, tier2: string } — see getHomeModelManifest in
 * utils/constant.js): tier-1 (ground + all 7 buildings, ONE merged file) is
 * the first thing shown, made to load as fast as possible on its own, then
 * REVEALED progressively (see scheduleStaggeredReveal above) once it
 * arrives; tier-2 (trees/amenities, ONE merged file) streams in afterward,
 * live, once tier-1 is already visible — deliberately not fetched in the
 * same breath as tier-1, so tier-1 gets the network and the main thread to
 * itself instead of competing with tier-2's download/parse for both.
 *
 * Reuses use-glb-loader.js's existing per-URL fetch/cache/retry engine
 * UNCHANGED via subscribeGLB (a non-hook subscription primitive) — this
 * hook only owns the merge-into-one-persistent-Group bookkeeping.
 *
 * @param {{ tier1: string, tier2: string } | null} manifest
 * @param {(loader: import('three').Loader) => void} configureLoader
 */
export const useGLBChunksLoader = (manifest, configureLoader) => {
  const configureLoaderRef = useRef(configureLoader);
  configureLoaderRef.current = configureLoader;

  const groupRef = useRef(null);
  if (!groupRef.current) {
    groupRef.current = new THREE.Group();
    groupRef.current.name = "HomeChunksMergedGroup";
  }

  // Plain refs, not state — mutated synchronously by subscription callbacks
  // before mergeVersion is bumped, so by the time a re-render driven by that
  // bump actually runs, these already reflect the update that triggered it.
  // mergeVersion is the ONLY thing that needs to be React state: it's what
  // use-home-scene.js's tuning effect and environment-setup.jsx's glass
  // effect key their dependency arrays off of, so in-place additions to the
  // (identity-stable) group actually trigger those re-runs.
  const [mergeVersion, setMergeVersion] = useState(0);
  const tier1StatusRef = useRef("pending"); // "pending" | "loaded" | "error"
  const tier2StatusRef = useRef("pending");
  const tier1FullyRevealedRef = useRef(false);
  const tier2FullyRevealedRef = useRef(false);
  const errorsRef = useRef({});

  useEffect(() => {
    // Module-scope pointers for external reset code (use-home.js's
    // handleResetCache) — set here, not during render, since mutating a
    // module-scope binding during render is a side effect (flagged by the
    // React Compiler's purity rule). groupRef.current's identity is stable
    // across renders, so re-running this on every `manifest` change (which
    // itself only happens once per mount, see manifest's own one-time-
    // resolution contract) is harmless.
    activeGroup = groupRef.current;
    activeManifest = manifest;

    if (!manifest) return undefined;

    const group = groupRef.current;
    const unsubscribers = [];

    // Reset per-mount bookkeeping — a new manifest (e.g. viewport crossed
    // the mobile/desktop breakpoint on first render, see getHomeModelPath's
    // own one-time-resolution contract) means a genuinely fresh load.
    tier1StatusRef.current = "pending";
    tier2StatusRef.current = "pending";
    tier1FullyRevealedRef.current = false;
    tier2FullyRevealedRef.current = false;
    errorsRef.current = {};

    let cancelled = false;
    let tier2Started = false;

    const bumpVersion = () => setMergeVersion((v) => v + 1);

    const startTier2 = () => {
      if (tier2Started || cancelled) return;
      tier2Started = true;

      unsubscribers.push(
        subscribeGLB(manifest.tier2, configureLoaderRef.current, ({ scene, error }) => {
          if (error) {
            errorsRef.current = { ...errorsRef.current, tier2: error };
            tier2StatusRef.current = "error";
            // Nothing arrived to reveal — settle immediately so anything
            // gated on tier2FullyRevealed (e.g. SceneReadyGate's final
            // compile pass) never waits forever on a permanently-failed
            // tier2.
            tier2FullyRevealedRef.current = true;
            bumpVersion();
            return;
          }
          if (!scene || tier2StatusRef.current === "loaded") return;
          tier2StatusRef.current = "loaded";
          const arrivedNodes = [...scene.children];
          arrivedNodes.forEach((node) => group.add(node));
          // Reveals trees_vegetation, then amenities_pools, in the same
          // staggered fashion as tier-1 — see scheduleStaggeredReveal's own
          // doc comment.
          unsubscribers.push(
            scheduleStaggeredReveal(
              arrivedNodes,
              TIER2_REVEAL_GROUP_ORDER,
              () => cancelled,
              () => {
                tier2FullyRevealedRef.current = true;
                bumpVersion();
              },
            ),
          );
          bumpVersion();
        }),
      );
    };

    unsubscribers.push(
      subscribeGLB(manifest.tier1, configureLoaderRef.current, ({ scene, error }) => {
        if (error) {
          errorsRef.current = { ...errorsRef.current, tier1: error };
          tier1StatusRef.current = "error";
          tier1FullyRevealedRef.current = true; // nothing arrived to reveal
          bumpVersion();
          startTier2(); // tier-1 failing must never hold up tier-2 behind it
          return;
        }
        if (!scene || tier1StatusRef.current === "loaded") return;
        tier1StatusRef.current = "loaded";
        const arrivedNodes = [...scene.children];
        arrivedNodes.forEach((node) => group.add(node));
        // Reveals ground_surface immediately, then each building A-G in a
        // fast staggered sequence — see scheduleStaggeredReveal's own doc
        // comment. Purely visual: all nodes are already added/tuned
        // together above regardless of this timing. tier1FullyRevealedRef
        // only flips once every group has turned visible — NOT the same
        // moment as tier1StatusRef flipping to "loaded" (that just means
        // the data arrived) — index.jsx gates BuildingMarkers on the
        // former specifically, since markers render from fixed positions
        // independent of individual building visibility.
        unsubscribers.push(
          scheduleStaggeredReveal(
            arrivedNodes,
            TIER1_REVEAL_GROUP_ORDER,
            () => cancelled,
            () => {
              tier1FullyRevealedRef.current = true;
              bumpVersion();
            },
          ),
        );
        bumpVersion();
        startTier2();
      }),
    );

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
    // manifest is resolved once per mount (see getHomeModelManifest's doc
    // comment) and never changes identity thereafter, so this effect
    // genuinely only needs to run once — same contract use-home-scene.js's
    // existing modelPath useState already relies on.
  }, [manifest]);

  if (import.meta.env?.DEV && Object.keys(errorsRef.current).length > 0) {
    logger.warn("[useGLBChunksLoader] chunk load errors", errorsRef.current);
  }

  return {
    scene: groupRef.current,
    mergeVersion,
    tier1Ready: tier1StatusRef.current === "loaded",
    tier1Settled: tier1StatusRef.current !== "pending",
    tier1FullyRevealed: tier1FullyRevealedRef.current,
    tier2Ready: tier2StatusRef.current === "loaded",
    tier2Settled: tier2StatusRef.current !== "pending",
    tier2FullyRevealed: tier2FullyRevealedRef.current,
    errors: errorsRef.current,
  };
};

/**
 * The currently-mounted Home scene's merged group, or null before the first
 * chunk has arrived / after a cache reset. For external reset flows only
 * (use-home.js's handleResetCache) — scene code should use the hook's own
 * return value, not this.
 */
export const getHomeMergedGroup = () => activeGroup;

/**
 * Disposes the merged group's current GPU resources and evicts both
 * manifest URLs (tier1 + tier2) from use-glb-loader.js's cache, so the next
 * mount performs genuine re-fetches instead of serving stale cache hits.
 * Mirrors the single-file disposeThreeScene+clearGLBCache pattern
 * use-home.js used before chunking, generalized to the tier manifest.
 *
 * Disposing the MERGED group (not each tier's own original GLTF root) is
 * required: once a tier's top-level nodes are reparented into the merged
 * group via `.add()`, the original per-URL cached scene's `.children` is
 * left empty — disposing that original scene instead would traverse nothing
 * and leak every geometry/material/texture that actually moved.
 *
 * @param {{ tier1: string, tier2: string } | null} [manifest]
 *   Defaults to whatever manifest the hook last mounted with.
 */
export const clearHomeModelCaches = (manifest = activeManifest) => {
  if (activeGroup) {
    disposeThreeScene(activeGroup);
    activeGroup.clear();
  }
  activeGroup = null;

  if (!manifest) return;
  clearGLBCache(manifest.tier1);
  clearGLBCache(manifest.tier2);
};

export default useGLBChunksLoader;
