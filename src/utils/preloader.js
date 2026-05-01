import { useGLTF } from "@react-three/drei";
import { BUILDING_CONFIG } from "./constant";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const THREE_PATH = "https://unpkg.com/three@0.172.0";
const DRACO_PATH = `${THREE_PATH}/examples/jsm/libs/draco/gltf/`;
const BASIS_PATH = `${THREE_PATH}/examples/jsm/libs/basis/`;

/**
 * Shared loader configuration for performance
 */
export const configureLoader = (loader) => {
  const dracoLoader = new DRACOLoader().setDecoderPath(DRACO_PATH);
  const ktx2Loader = new KTX2Loader().setTranscoderPath(BASIS_PATH);
  loader.setDRACOLoader(dracoLoader);
  loader.setKTX2Loader(ktx2Loader);
  loader.setMeshoptDecoder(MeshoptDecoder);
};

/**
 * Triggers parallel preloading of all building and hitbox models.
 * Should be called at the root level (main.jsx).
 */
export const preloadModels = () => {
  BUILDING_CONFIG.forEach((b) => {
    if (b.model) {
      useGLTF.preload(b.model, DRACO_PATH, false, configureLoader);
    }
    if (b.hitbox) {
      useGLTF.preload(b.hitbox, DRACO_PATH, false, configureLoader);
    }
  });
};
