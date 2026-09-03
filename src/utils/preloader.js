import { useGLTF, useEnvironment } from "@react-three/drei";
import { BUILDING_CONFIG, getAssetPath } from "./constant";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// ✅ Singleton instances — created once, reused everywhere
// DRACO handles mesh compression (geometry)
const DRACO_PATH = getAssetPath("/draco/");
const BASIS_PATH = getAssetPath("/basis/");

const maxDracoWorkers =
  typeof navigator !== "undefined"
    ? Math.min(Math.max(navigator.hardwareConcurrency || 2, 2), 4)
    : 2;

const dracoLoader = new DRACOLoader()
  .setDecoderPath(DRACO_PATH)
  .setDecoderConfig({ type: "wasm" })
  .setWorkerLimit(maxDracoWorkers);
const ktx2Loader = new KTX2Loader().setTranscoderPath(BASIS_PATH);

// NOT calling MeshoptDecoder.useWorkers() here (tried once, reverted).
// It offloads EXT_meshopt_compression decoding to a Web Worker, but
// meshopt_decoder.module.js builds that worker's source by string-
// concatenating `decode.toString() + workerProcess.toString()` plus a
// hardcoded literal `"self.onmessage = workerProcess;"` — production
// minification renames the actual `workerProcess` function (an unexported
// module-scope binding) but can't touch that hardcoded string, so the
// built worker throws `ReferenceError: workerProcess is not defined` the
// moment it's used. This only reproduces in a minified build; dev mode
// keeps the real names, so it looked fine there. Verified directly against
// the vendored module (node_modules/three/examples/jsm/libs/
// meshopt_decoder.module.js) before reverting — this is a real fragility
// in that file, not a one-off fluke. Without useWorkers(), decodeGltfBufferAsync
// falls back to its default main-thread path, which is slower per the
// comment that used to be here, but is correct in every build mode.
// Re-attempting the worker offload would need `mangle.reserved: ['decode',
// 'workerProcess']` (or equivalent) in the build's minifier config, verified
// against an actual production build, before it's safe to re-enable.

let ktx2SupportDetected = false;
let resolveKTX2Ready;

/**
 * Resolves the first time a live WebGLRenderer reaches initKTX2 below.
 *
 * Anything that parses a GLB containing KHR_texture_basisu textures from
 * OUTSIDE a mounted <Canvas> — i.e. the idle cross-route warm-up in
 * src/main.jsx — must await this. KTX2Loader throws "Missing initialization
 * with `.detectSupport( renderer )`" otherwise, and a renderer only exists once
 * a Canvas has committed. Awaiting a promise is deterministic; racing the first
 * Canvas commit against a requestIdleCallback is not.
 *
 * Never resolves if no Canvas ever mounts (e.g. WebGL unavailable) — which is
 * correct: there is nothing to warm up in that case.
 */
const ktx2ReadyPromise = new Promise((resolve) => {
  resolveKTX2Ready = resolve;
});

export const whenKTX2Ready = () => ktx2ReadyPromise;

/**
 * KTX2Loader cannot transcode until it knows which compressed texture formats
 * the GPU supports, and that requires a live WebGLRenderer — which does not
 * exist at module scope. Without this call KTX2Loader throws
 * "Missing initialization with `.detectSupport( renderer )`" the moment it meets
 * a KHR_texture_basisu texture, so any KTX2 asset fails to load.
 *
 * Idempotent, so it is safe to call from a render-phase effect on every mount.
 * Must run BEFORE the first GLB request that could contain KTX2 textures.
 *
 * @param {import("three").WebGLRenderer} renderer
 */
export const initKTX2 = (renderer) => {
  if (ktx2SupportDetected || !renderer) return;
  ktx2Loader.detectSupport(renderer);
  ktx2SupportDetected = true;
  resolveKTX2Ready();
};

/**
 * Shared loader configuration for performance.
 *
 * DRACO handles geometry, Meshopt handles geometry + animation
 * (EXT_meshopt_compression), KTX2/BASIS handles GPU-compressed textures
 * (KHR_texture_basisu). Attaching a loader is free — it is only invoked when the
 * asset actually declares the matching extension. KTX2 additionally needs
 * initKTX2(renderer) to have run.
 */
export const configureLoader = (loader) => {
  loader.setDRACOLoader(dracoLoader);
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);
};

/**
 * Triggers DRACOLoader's WASM decoder fetch+instantiate ahead of need, in
 * parallel with whatever GLB fetch is already in flight — without this, the
 * decoder lazily instantiates itself the moment the FIRST Draco-compressed
 * primitive is actually decoded (i.e. only once GLTFLoader.parse() reaches
 * that point, sequentially AFTER the GLB's own network fetch has already
 * completed), adding WASM-compile latency on the critical path instead of
 * overlapping it with the download. Safe to call multiple times — DRACOLoader
 * internally no-ops a repeat preload() once already in flight/resolved.
 */
export const preloadDracoDecoder = () => {
  try {
    dracoLoader.preload();
  } catch {
    // Ignore if already preloaded
  }
};

export const getInitialLandingBuilding = () => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const buildingParam = params.get("building");
    if (buildingParam) {
      const b = BUILDING_CONFIG.find(
        (c) => c.name.toUpperCase() === buildingParam.toUpperCase(),
      );
      if (b) return b;
    }
  }
  return BUILDING_CONFIG[0];
};

/**
 * Set of already requested asset URLs to prevent duplicate loads.
 */
const loadedAssetUrls = new Set();

const safePreloadGLTF = (path) => {
  if (!path || loadedAssetUrls.has(path)) return Promise.resolve();
  loadedAssetUrls.add(path);
  return new Promise((resolve) => {
    try {
      whenKTX2Ready().then(() => {
        useGLTF.preload(path, false, false, configureLoader);
        if (typeof window !== "undefined" && window.requestIdleCallback) {
          window.requestIdleCallback(() => resolve(), { timeout: 1200 });
        } else {
          setTimeout(resolve, 250);
        }
      }).catch(() => resolve());
    } catch {
      resolve();
    }
  });
};

const safePreloadEnv = (env) => {
  if (!env) return Promise.resolve();
  const key = typeof env === "object" ? JSON.stringify(env) : String(env);
  if (loadedAssetUrls.has(key)) return Promise.resolve();
  loadedAssetUrls.add(key);
  return new Promise((resolve) => {
    try {
      useEnvironment.preload(env);
      if (typeof window !== "undefined" && window.requestIdleCallback) {
        window.requestIdleCallback(() => resolve(), { timeout: 800 });
      } else {
        setTimeout(resolve, 200);
      }
    } catch {
      resolve();
    }
  });
};

/**
 * Preload a specific building model, hitbox, and environment.
 */
export const preloadBuilding = (buildingIndexOrName) => {
  const config =
    typeof buildingIndexOrName === "number"
      ? BUILDING_CONFIG[buildingIndexOrName]
      : BUILDING_CONFIG.find(
          (b) =>
            b.name.toUpperCase() === String(buildingIndexOrName).toUpperCase(),
        );
  if (!config) return;
  if (config.model) safePreloadGLTF(config.model);
  if (config.hitbox) safePreloadGLTF(config.hitbox);
  if (config.environment) safePreloadEnv(config.environment);
};

let isSequentialPreloadRunning = false;
let isSequentialPreloadCancelled = false;

/**
 * Starts a sequential background queue that downloads Building A, B, C, D, E, F, G
 * one after another during idle browser frames.
 * Safe to call multiple times (idempotent).
 */
export const startSequentialBuildingPreload = async () => {
  if (isSequentialPreloadRunning) return;
  isSequentialPreloadRunning = true;
  isSequentialPreloadCancelled = false;

  const queue = [];
  BUILDING_CONFIG.forEach((config) => {
    if (config.model && !loadedAssetUrls.has(config.model)) {
      queue.push({ type: "model", path: config.model });
    }
    if (config.hitbox && !loadedAssetUrls.has(config.hitbox)) {
      queue.push({ type: "hitbox", path: config.hitbox });
    }
    if (config.environment) {
      const key =
        typeof config.environment === "object"
          ? JSON.stringify(config.environment)
          : String(config.environment);
      if (!loadedAssetUrls.has(key)) {
        queue.push({ type: "env", path: config.environment });
      }
    }
  });

  for (const item of queue) {
    if (isSequentialPreloadCancelled) break;
    if (item.type === "env") {
      await safePreloadEnv(item.path);
    } else {
      await safePreloadGLTF(item.path);
    }
  }

  isSequentialPreloadRunning = false;
};

export const cancelSequentialBuildingPreload = () => {
  isSequentialPreloadCancelled = true;
  isSequentialPreloadRunning = false;
};

/**
 * Triggers prioritized preloading of unique building and hitbox models.
 */
export const preloadModels = () => {
  const landingBuilding = getInitialLandingBuilding();
  const landingModel = landingBuilding.model;
  const landingHitbox = landingBuilding.hitbox;

  const landingEnv = landingBuilding.environment;

  // 1. High Priority: Landing building
  // useDraco/useMeshopt passed as `false`: drei's useGLTF/preload wrapper
  // only overrides configureLoader's self-hosted DRACOLoader with its own
  // gstatic.com-CDN-backed one when these flags are truthy — see the
  // matching comment in use-building-instance.js.
  //
  // Gated on whenKTX2Ready(): the building GLBs now carry KHR_texture_basisu
  // textures (converted from plain webp/jpeg to KTX2 for GPU-compressed VRAM
  // usage on low-end devices), and this call can run from main.jsx BEFORE any
  // <Canvas> — and therefore no live WebGLRenderer — exists. Same reasoning
  // as the HOME_MODEL_PATH preload in src/main.jsx; see whenKTX2Ready's own
  // doc comment above. The hitbox/env preloads don't carry KTX2 textures, but
  // are grouped here for simplicity — the wait costs them nothing, since both
  // resolve on the same "first Canvas mounted" event this already needs.
  preloadDracoDecoder();

  whenKTX2Ready().then(() => {
    if (landingModel)
      useGLTF.preload(landingModel, false, false, configureLoader);
    if (landingHitbox)
      useGLTF.preload(landingHitbox, false, false, configureLoader);
  });
  if (landingEnv) useEnvironment.preload(landingEnv);
};

export const preloadBackgroundModels = () => {
  const landingBuilding = getInitialLandingBuilding();
  const landingModel = landingBuilding.model;
  const landingHitbox = landingBuilding.hitbox;
  const landingEnv = landingBuilding.environment;

  // 2. Background Priority: Remaining unique models
  const otherModels = [
    ...new Set(
      BUILDING_CONFIG.map((b) => b.model).filter(
        (path) => path && path !== landingModel,
      ),
    ),
  ];
  const otherHitboxes = [
    ...new Set(
      BUILDING_CONFIG.map((b) => b.hitbox).filter(
        (path) => path && path !== landingHitbox,
      ),
    ),
  ];
  const otherEnvs = [
    ...new Set(
      BUILDING_CONFIG.map((b) => b.environment).filter(
        (env) => env && env !== landingEnv,
      ),
    ),
  ];

  whenKTX2Ready().then(() => {
    otherModels.forEach((path) =>
      useGLTF.preload(path, false, false, configureLoader),
    );
    otherHitboxes.forEach((path) =>
      useGLTF.preload(path, false, false, configureLoader),
    );
  }).catch(() => {});
  otherEnvs.forEach((env) => useEnvironment.preload(env));
};

/**
 * Recursively disposes geometries, materials, and textures for a Three.js Object3D.
 * Useful for freeing GPU memory when clearing model caches or unmounting scenes.
 *
 * @param {import("three").Object3D} object
 */
export const disposeThreeScene = (object) => {
  if (!object) return;

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((mat) => {
        if (!mat) return;

        // Dispose textures
        Object.keys(mat).forEach((key) => {
          if (mat[key] && mat[key].isTexture) {
            mat[key].dispose();
          }
        });

        mat.dispose();
      });
    }
  });
};
