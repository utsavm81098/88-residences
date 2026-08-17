import { useGLTF, useEnvironment } from "@react-three/drei";
import { BUILDING_CONFIG } from "./constant";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// ✅ Singleton instances — created once, reused everywhere
// DRACO handles mesh compression (geometry)
// BASIS handles texture compression (images)
const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

const DRACO_PATH = `${BASE_URL}/draco/`;
const BASIS_PATH = `${BASE_URL}/basis/`;

const dracoLoader = new DRACOLoader().setDecoderPath(DRACO_PATH);
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
 * Triggers prioritized preloading of unique building and hitbox models.
 * Senior approach: Only load unique file paths to save bandwidth.
 * Staggered loading for low-end systems.
 */
export const preloadModels = () => {
  const landingBuilding = BUILDING_CONFIG[0];
  const landingModel = landingBuilding.model;
  const landingHitbox = landingBuilding.hitbox;

  const landingEnv = landingBuilding.environment;

  // 1. High Priority: Landing building
  // useDraco/useMeshopt passed as `false`: drei's useGLTF/preload wrapper
  // only overrides configureLoader's self-hosted DRACOLoader with its own
  // gstatic.com-CDN-backed one when these flags are truthy — see the
  // matching comment in use-building-instance.js.
  if (landingModel)
    useGLTF.preload(landingModel, false, false, configureLoader);
  if (landingHitbox)
    useGLTF.preload(landingHitbox, false, false, configureLoader);
  if (landingEnv) useEnvironment.preload(landingEnv);
};

export const preloadBackgroundModels = () => {
  const landingBuilding = BUILDING_CONFIG[0];
  const landingModel = landingBuilding.model;
  const landingHitbox = landingBuilding.hitbox;
  const landingEnv = landingBuilding.environment;

  // 2. Background Priority: Remaining unique models
  const otherModels = [
    ...new Set(
      BUILDING_CONFIG.slice(1)
        .map((b) => b.model)
        .filter((path) => path && path !== landingModel),
    ),
  ];
  const otherHitboxes = [
    ...new Set(
      BUILDING_CONFIG.slice(1)
        .map((b) => b.hitbox)
        .filter((path) => path && path !== landingHitbox),
    ),
  ];
  const otherEnvs = [
    ...new Set(
      BUILDING_CONFIG.slice(1)
        .map((b) => b.environment)
        .filter((env) => env && env !== landingEnv),
    ),
  ];

  otherModels.forEach((path) =>
    useGLTF.preload(path, false, false, configureLoader),
  );
  otherHitboxes.forEach((path) =>
    useGLTF.preload(path, false, false, configureLoader),
  );
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
