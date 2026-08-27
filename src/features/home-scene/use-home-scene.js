import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { configureLoader } from "@/utils/preloader";
import { getHomeModelPath } from "@/utils/constant";
import { useGLBLoader } from "@/hooks/use-glb-loader";

// Ground overlay/decal materials that lie co-planar on top of base terrain
const DECAL_MAT_RE =
  /crossing_path|patch_grass|off_road|road_proj|inner_road|aya_road|fance_line|plane__block|plane__marble|plane__west|blocks_pool_side/i;

// White road lines & markings painted directly on top of road surfaces
const ROAD_LINE_MAT_RE =
  /roads?_line|line_mesh|loine_mesh|roads?_mesh|park_line|whitye|material__3472|material__3048|adskmatwhite|white.*line/i;

// Rooftop solar-panel materials. Originally matched by NODE name
// (/^solar_|^sol-d/i on "Solar_402", "SOL-D_147", etc.) — switched to exact
// MATERIAL names after verifying against the GLB's JSON chunk that all three
// ("Material__2965", "M_11___Default", "Material__3218") are each used
// EXCLUSIVELY by solar-panel nodes (0 other nodes reference them). Material
// identity survives geometry-level optimization passes (GPU instancing,
// joining) that node names don't: instancing this GLB with
// @gltf-transform/functions' instance({min:5}) collapsed 507 of these 507
// solar-panel nodes into 103 unnamed instanced batches, silently breaking
// the node-name match entirely — matching on material name instead is
// robust to that (and to any future geometry optimization) since it doesn't
// depend on any particular node surviving with its name intact.
//
// These are authored at roughnessFactor 0.1 / metallicFactor 0.8, i.e.
// near-mirror. That, combined with scene.environment's RoomEnvironment IBL
// (whose "neutral" PMREM is literally a lit room containing several bright
// box-shaped area-light meshes — see three's RoomEnvironment.js) and the
// single hardcoded sun directionalLight in scene-lights.jsx, produced two
// glaring hotspots on every roof: a sharp circular highlight (the sun's
// punctual specular reflecting off a near-zero-roughness surface) and a
// sharp square highlight (one of RoomEnvironment's box lights reflecting via
// the IBL). Real anti-reflective solar glass is not a mirror, so roughness
// is raised and envMapIntensity capped here — same by-name material tuning
// pattern as Gray_BUILD/leaf-cutout above — to spread both hotspots into a
// soft sheen instead of two sharp geometric glare shapes.
const SOLAR_PANEL_MATERIAL_NAMES = new Set([
  "Material__2965",
  "M_11___Default",
  "Material__3218",
]);

// Volumetric round-crown mango tree materials ("Mango_BARK", "Mango_Tree").
// Originally matched by NODE name (/^MANGO_tree/i) — switched to exact
// MATERIAL names for the same reason as SOLAR_PANEL_MATERIAL_NAMES above:
// verified both are used exclusively by mango-tree nodes, and material
// identity survives geometry optimization passes that node names don't.
// Unlike flat billboard leaf cards, these are multi-directional meshes whose
// canopy relies on IBL bounce to fill self-shadowed leaf clusters. They are
// exempted from the leaf-cutout roughness floor below, so their GLB-authored
// material is preserved untouched.
const MANGO_TREE_MATERIAL_NAMES = new Set(["Mango_BARK", "Mango_Tree"]);

// Floor applied to leaf-cutout materials' roughness (see isLeafCutout below).
// Enforces a minimum roughness of 0.6 so IBL specular highlights are broad
// and soft on flat billboard cards, avoiding specular shimmer during camera orbit.
const LEAF_SPECULAR_ROUGHNESS_FLOOR = 0.6;

// The single "G- WOOD_RAILING" node (material "adskMatG__WOOD_RAILING") —
// unlike the repeated Obj_RAILING_* glass balcony panels below, this is a
// unique, one-off opaque wood railing that flickers/z-fights during camera
// orbit. Root cause (verified against the actual GLB): this is a 12,182-
// vertex, doubleSided mesh with no prior name-based tuning at all, viewed at
// roughly 75-200x the camera's near plane (near=2, far=1400 — see
// HOME_CAMERA in utils/constant.js), well into the range where a standard
// 24-bit depth buffer's precision is already degraded — the same class of
// issue Gray_BUILD/DECAL_MAT_RE/ROAD_LINE_MAT_RE below already fix by name
// for other materials, just never extended to this one. polygonOffset (not
// disabling doubleSided) is the safe fix here: it cannot make any geometry
// disappear, it only breaks the depth-test tie.
const WOOD_RAILING_MAT_NAME = "adskMatG__WOOD_RAILING";

// Balcony glass railing panels ("Obj_RAILING - 017_60", etc.).
// The GLB authors used KHR_materials_transmission (physical glass, transmission=1)
// which the GLTF editor renders as completely invisible see-through glass.
// Three.js MeshPhysicalMaterial with transmission > 0 requires a dedicated
// transmission render target (a pre-rendered background texture sampled behind
// the glass). Without it, Three.js renders the mesh as a dark/black opaque slab.
// Fix: detect transmission > 0, zero it out, switch to standard alpha-blend at
// near-zero opacity (0.05) to match the "essentially invisible" GLTF editor look.
// Roughness, metalness, and color are NOT touched — they come from the GLB.
const RAILING_NODE_RE = /^Obj_RAILING/i;

export const useHomeScene = ({ active = true } = {}) => {
  // Byte-level streamed fetch + manual GLTFLoader.parse(), NOT drei's
  // useGLTF/useLoader. useLoader is hardwired to THREE.DefaultLoadingManager
  // — a single instance shared by every loader in the app — whose progress
  // math resets toward 0 every time an unrelated load elsewhere (another
  // page's preload, a texture fetch) starts a new request batch. Streaming
  // the download ourselves gives progress that is continuous, proportional
  // to real bytes transferred, and immune to anything else happening in the
  // app. See use-glb-loader.js for the full rationale.
  //
  // `progress` (0-100, byte-level) is deliberately NOT consumed. The home loader is
  // a full-screen day/night carousel with no percentage readout (see
  // containers/home/home-loader.jsx), and bubbling the value up re-rendered
  // HomeContainer and <Canvas> once per streamed chunk for no visual effect. The
  // value is still returned here if a readout is ever wanted again.
  // High-tier devices get the full-texture-resolution model; mobile/tablet
  // AND weak-GPU desktops get the VRAM-reduced variant (see
  // getHomeModelPath's doc comment in utils/constant.js) — same
  // node/material names either way, so every by-name fixup below applies
  // unchanged regardless of which loads.
  //
  // Resolved via a lazy useState initializer (called once, synchronously,
  // on the first render), NOT read fresh on every render: getHomeModelPath()
  // is a plain synchronous function (no hook lag to guard against, unlike
  // useIsMobile — its own state starts undefined-coerced-false for one
  // render before self-correcting), but the URL it returns still needs to
  // stay fixed for the life of this mount so it can't flip and trigger a
  // second, wasted fetch for the other variant mid-session.
  const [modelPath] = useState(() => getHomeModelPath());

  // Latches true the first time this scene actually becomes the visible
  // one, and never reverts — mirrors features/building/use-building.js's
  // `mountBackground`/`warmedUp` gating for the same reason: HomeScene is a
  // permanently-mounted sibling under the single shared Canvas (see
  // containers/scene-canvas/index.jsx's `<group visible={isHome}>`), so
  // without this gate its ~35-46MB GLB fetch fired on EVERY cold load
  // regardless of whether Inventory, not Home, was the actual landing
  // route. Once true, behaves identically to before this change — a
  // returning-to-Home visit never re-fetches or re-gates.
  //
  // Initialized from `active` itself (not `false`), so a COLD LANDING ON
  // HOME is unaffected by this change at all: hasBeenActive is already
  // true on the very first render, in the same render pass, so the fetch
  // starts exactly when it always has.
  const [hasBeenActive, setHasBeenActive] = useState(active);
  useEffect(() => {
    if (active) setHasBeenActive(true);
  }, [active]);

  const { scene, error } = useGLBLoader(
    hasBeenActive ? modelPath : null,
    configureLoader,
  );
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useMemo(
    () =>
      gl?.capabilities ? Math.min(gl.capabilities.getMaxAnisotropy(), 16) : 16,
    [gl],
  );

  // Rethrown during render so the existing ComponentErrorBoundary (in
  // containers/home/index.jsx) catches it exactly as it would have caught a
  // rejected Suspense promise from useGLTF.
  if (error) throw error;

  const tunedScene = useMemo(() => {
    if (!scene) return null;

    scene.traverse((child) => {
      // Freeze per-object matrix updates — scene geometry never moves.
      child.matrixAutoUpdate = false;

      // NOTE: frustumCulled is intentionally left at its default (true for Mesh,
      // ignored for non-Mesh). Disabling it on all 318+ objects forces the GPU to
      // process every mesh even when off-screen during camera rotation — that was
      // the primary cause of per-frame lag. scene.updateMatrixWorld(true) below
      // ensures all bounding spheres are current, so frustum culling is safe.

      if (!child.isMesh && !child.isInstancedMesh) return;
      if (!child.material) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      // Compute node-level flags once — these are based on child.name which is
      // constant across all materials of this mesh.
      const isRailing = RAILING_NODE_RE.test(child.name || "");

      materials.forEach((material) => {
        if (!material) return;

        if (material.name === "Gray_BUILD") {
          material.transmission = 0;
          material.thickness = 0;
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
          material.depthTest = true;
          material.side = THREE.FrontSide;
          material.polygonOffset = true;
          material.polygonOffsetFactor = 1;
          material.polygonOffsetUnits = 1;

          material.needsUpdate = true;
        }

        // G- WOOD_RAILING flicker fix — see WOOD_RAILING_MAT_NAME's comment.
        if (material.name === WOOD_RAILING_MAT_NAME) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = 1;
          material.polygonOffsetUnits = 1;
          material.needsUpdate = true;
        }

        // Road lines & white markings: painted directly on top of asphalt/ground decals.
        // Apply stronger negative polygonOffset (-2.5) and renderOrder (2) so WebGL depth
        // testing deterministically places them above asphalt without Z-fighting or clipping.
        const isRoadLine =
          ROAD_LINE_MAT_RE.test(material.name || "") ||
          ROAD_LINE_MAT_RE.test(child.name || "");

        if (isRoadLine) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = -2.5;
          material.polygonOffsetUnits = -2.5;
          material.depthWrite = true;
          material.depthTest = true;
          child.renderOrder = 2;
          material.needsUpdate = true;
        }

        // Apply polygonOffset to co-planar ground overlays/road decals so WebGL draws them
        // slightly above base terrain without any Z-fighting/flickering
        const isDecal =
          DECAL_MAT_RE.test(material.name || "") ||
          DECAL_MAT_RE.test(child.name || "");

        if (isDecal && !isRoadLine) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -1;
          child.renderOrder = 1;
          material.needsUpdate = true;
        }

        // Rooftop solar panels: soften the near-mirror GLB material (roughness
        // 0.1 / metalness 0.8) so the sun's specular highlight and the
        // RoomEnvironment IBL's box-light reflections spread into a soft sheen
        // instead of rendering as a sharp circle + square glare on every roof.
        const isSolarPanel = SOLAR_PANEL_MATERIAL_NAMES.has(material.name);

        if (isSolarPanel) {
          material.roughness = Math.max(material.roughness ?? 0, 0.45);
          material.envMapIntensity = 0.35;
          material.needsUpdate = true;
        }

        // Balcony glass railing panels: the GLB uses KHR_materials_transmission
        // (physical glass) which the GLTF editor renders as completely invisible.
        // Three.js cannot render physical transmission without a dedicated render
        // target — it outputs a dark opaque slab instead. Convert to standard
        // alpha-blend at near-zero opacity to match the invisible-glass appearance.
        // Roughness, metalness, and color come 100% from the GLB.
        if (
          isRailing &&
          (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)
        ) {
          // Disable physical transmission — Three.js needs a transmission render
          // target to process it; without one the surface renders pitch-black.
          if (
            material.isMeshPhysicalMaterial &&
            (material.transmission ?? 0) > 0
          ) {
            material.transmission = 0;
            material.thickness = 0;
          }
          // Semi-transparent frosted glass: matches the milky, partially see-through
          // panels visible in the GLTF editor reference. ~65% transparent.
          material.transparent = true;
          material.opacity = 0.4;
          material.depthWrite = false; // don't occlude geometry behind the panel
          material.side = THREE.DoubleSide; // visible from inside + outside balcony
          material.needsUpdate = true;
        }

        // Store original GLB alphaTest on first inspection to guarantee clean reset
        if (material.userData.__glbAlphaTest === undefined) {
          material.userData.__glbAlphaTest = material.alphaTest;
        } else {
          material.alphaTest = material.userData.__glbAlphaTest;
        }

        // Target leaf cutout materials (materials with alphaTest / alphaCutoff > 0 in GLB).
        // Railing nodes are explicitly excluded: they have their own transparent-glass
        // treatment above and must NOT receive the foliage overrides (alphaToCoverage +
        // the roughness floor below would break the glass look).
        const isLeafCutout =
          (material.alphaTest > 0 || material.alphaMap) &&
          !material.name.toLowerCase().includes("glass") &&
          !isRailing;

        if (isLeafCutout) {
          // DoubleSide ensures reverse faces of leaf planes render illuminated from all camera angles
          material.side = THREE.DoubleSide;

          // WebGL2 Alpha-to-Coverage converts continuous alpha values into MSAA sub-pixel sample masks,
          // preventing binary on/off fragment discard flickering during camera rotation
          material.alphaToCoverage = true;

          // Setting alphaTest to 0.35 cleanly clips dark transparent border bleed from KTX2 mipchains
          // while alphaToCoverage provides smooth sub-pixel geometric anti-aliasing via MSAA
          material.alphaTest = 0.35;

          // Disable shadow casting and receiving on foliage leaf meshes to eliminate temporal shadow
          // crawling noise (flickering dark specks on trees) during camera movement/rotation
          child.castShadow = false;
          child.receiveShadow = false;

          // Tree bases sit at the same Y as the grass/ground they're planted in, so their
          // card geometry is coplanar with the landscape at the trunk. Push leaf cards
          // slightly toward the camera so the depth test resolves deterministically instead
          // of alternating winner per-frame (z-fighting flicker) while orbiting. More
          // negative than the ground-decal offset (-1/-1) above so trees always win.
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1.2;
          material.polygonOffsetUnits = -1.2;

          // Leaf materials are lit, so scene.environment's IBL puts a specular highlight on flat,
          // double-sided leaf cards. Enforce a minimum roughness floor so the specular highlight
          // is broad and soft without high-frequency glints/shimmer during camera rotation.
          const isMango = MANGO_TREE_MATERIAL_NAMES.has(material.name);
          if (!isMango && material.roughness !== undefined) {
            material.roughness = Math.max(
              material.roughness,
              LEAF_SPECULAR_ROUGHNESS_FLOOR,
            );
          }

          material.needsUpdate = true;
        }

        // Apply anisotropy for crisp texture sampling across all slots, and enable
        // mipmapping on all textures to eliminate minification aliasing (shimmering).
        const TEXTURE_SLOTS = [
          "map",
          "alphaMap",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "bumpMap",
          "aoMap",
          "emissiveMap",
        ];

        const isPano =
          /pano|dome|sky|background|m1|dji/i.test(material.name || "") ||
          /pano|dome|sky|background|m1|dji/i.test(child.name || "");

        if (isPano) {
          material.side = THREE.DoubleSide;
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = false;
          material.needsUpdate = true;
        }

        TEXTURE_SLOTS.forEach((slot) => {
          const texture = material[slot];
          if (!texture || texture.userData.__optimized) return;

          texture.anisotropy = maxAnisotropy;
          texture.magFilter = THREE.LinearFilter;

          if (isPano) {
            // The 4K background panorama dome must sample at crisp native resolution without mipmaps
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
          } else if (texture.isCompressedTexture) {
            if (texture.mipmaps && texture.mipmaps.length > 1) {
              texture.minFilter = THREE.LinearMipmapLinearFilter;
              texture.generateMipmaps = false;
            } else {
              texture.minFilter = THREE.LinearFilter;
            }
          } else {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
          }

          texture.needsUpdate = true;
          texture.userData.__optimized = true;
        });
      });
    });

    scene.updateMatrixWorld(true);

    return scene;
  }, [scene, maxAnisotropy]);

  return { scene: tunedScene };
};

export default useHomeScene;
