import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";

const MODEL_PATH = getAssetPath("/models/88-fixed.glb");

// Materials that should read as reflective glazing. Match ONLY the material named exactly "GLASS"
const GLASS_NAME_RE = /^glass$/i;
const isGlassMaterial = (name = "") => GLASS_NAME_RE.test(name);

const GLASS_TUNING = {
  roughness: 0.05,
  metalness: 1.0,
  envMapIntensity: 1.2,
  clearcoat: 1.0,
  clearcoatRoughness: 0.06,
};

const GROUND_NAME_RE =
  /500m_plane|ground|earth|gravel|sand|crossing_path|side_road|shvil/i;
const GROUND_TUNING = {
  label: "ground",
  roughness: 1.0,
  metalness: 0.0,
};

const getReflectiveTuning = (name = "") => {
  if (isGlassMaterial(name)) return null;
  if (GROUND_NAME_RE.test(name)) return GROUND_TUNING;
  return null;
};

export const useHomeScene = () => {
  // 1. Load the GLB model using the preconfigured loader (Draco, KTX2, etc.)
  const { scene } = useGLTF(MODEL_PATH, true, true, configureLoader);

  // 2. Clone the scene once to prevent cache mutation
  const sceneClone = useMemo(() => {
    const clone = scene.clone();

    // Traverse: tune glass materials for reflections and ensure shadows are disabled on all meshes
    clone.traverse((child) => {
      if (!child.isMesh) return;

      // Disable shadows on all meshes to prevent tree shadows and shadow frustum artifacts
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;

      // Support both a single material and material arrays.
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((mat, i) => {
        if (!mat) return;

        // (a) GLASS — metallic mirror upgrade for clean window reflections
        if (isGlassMaterial(mat.name)) {
          const tuned = new THREE.MeshPhysicalMaterial();
          tuned.name = mat.name;
          if (mat.color) tuned.color.copy(mat.color);
          if (mat.emissive) tuned.emissive.copy(mat.emissive);
          if (mat.normalScale) tuned.normalScale.copy(mat.normalScale);
          tuned.map = mat.map ?? null;
          tuned.normalMap = mat.normalMap ?? null;
          tuned.transparent = mat.transparent;
          tuned.opacity = mat.opacity;
          tuned.side = mat.side;
          tuned.depthWrite = mat.depthWrite;
          tuned.roughness = GLASS_TUNING.roughness;
          tuned.metalness = GLASS_TUNING.metalness;
          tuned.envMapIntensity = GLASS_TUNING.envMapIntensity;
          tuned.clearcoat = GLASS_TUNING.clearcoat;
          tuned.clearcoatRoughness = GLASS_TUNING.clearcoatRoughness;
          tuned.needsUpdate = true;

          if (Array.isArray(child.material)) {
            child.material[i] = tuned;
          } else {
            child.material = tuned;
          }
          return;
        }

        // (b) GROUND / terrain — force matte so it stops mirroring the sky
        const tuning = getReflectiveTuning(mat.name);
        if (!tuning) return;

        const tuned = mat.clone();
        tuned.roughness = tuning.roughness;
        tuned.metalness = tuning.metalness;
        if (tuning.envMapIntensity !== undefined) {
          tuned.envMapIntensity = tuning.envMapIntensity;
        }
        tuned.needsUpdate = true;

        if (Array.isArray(child.material)) {
          child.material[i] = tuned;
        } else {
          child.material = tuned;
        }
      });
    });

    return clone;
  }, [scene]);

  return {
    scene: sceneClone,
  };
};

export default useHomeScene;
