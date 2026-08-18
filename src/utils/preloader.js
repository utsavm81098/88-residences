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
 * Set of already requested asset URLs to prevent duplicate loads.
 */
const loadedAssetUrls = new Set();

const safePreloadGLTF = (path) => {
  if (!path || loadedAssetUrls.has(path)) return Promise.resolve();
  loadedAssetUrls.add(path);
  return new Promise((resolve) => {
    try {
      useGLTF.preload(path, false, false, configureLoader);
      if (typeof window !== "undefined" && window.requestIdleCallback) {
        window.requestIdleCallback(() => resolve(), { timeout: 1200 });
      } else {
        setTimeout(resolve, 250);
      }
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
  const landingBuilding = BUILDING_CONFIG[0];
  if (landingBuilding?.model) safePreloadGLTF(landingBuilding.model);
  if (landingBuilding?.hitbox) safePreloadGLTF(landingBuilding.hitbox);
  if (landingBuilding?.environment) safePreloadEnv(landingBuilding.environment);
};

export const preloadBackgroundModels = () => {
  startSequentialBuildingPreload();
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
