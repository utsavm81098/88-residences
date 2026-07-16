import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";

const MODEL_PATH = getAssetPath("/models/88-fixed.glb");

export const useHomeScene = () => {
  // 1. Load the GLB model using the preconfigured loader (Draco, KTX2, etc.)
  const { scene } = useGLTF(MODEL_PATH, true, true, configureLoader);

  // 2. Clone the scene once to prevent cache mutation
  const sceneClone = useMemo(() => {
    const clone = scene.clone();

    // Traverse and configure shadows and matrix updates
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
      }
    });

    return clone;
  }, [scene]);

  return {
    scene: sceneClone,
  };
};

export default useHomeScene;
