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

/**
 * Shared loader configuration for performance
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
  if (landingModel)
    useGLTF.preload(landingModel, true, undefined, configureLoader);
  if (landingHitbox)
    useGLTF.preload(landingHitbox, true, undefined, configureLoader);
  if (landingEnv) useEnvironment.preload(landingEnv);

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
    useGLTF.preload(path, true, undefined, configureLoader),
  );
  otherHitboxes.forEach((path) =>
    useGLTF.preload(path, true, undefined, configureLoader),
  );
  otherEnvs.forEach((env) => useEnvironment.preload(env));
};
