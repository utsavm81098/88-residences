import { useMemo, useLayoutEffect } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";

const MODEL_PATH = getAssetPath("/models/88-fixed.glb");
const TEXTURE_PATH = getAssetPath("/hdr/80m-nano-green.jpg");

// Preload assets to prevent runtime lag
useGLTF.preload(MODEL_PATH, true, true, configureLoader);
useTexture.preload(TEXTURE_PATH);

export const useHomeScene = () => {
  const { gl, scene: threeScene, camera } = useThree();

  // 1. Load the GLB model using the preconfigured loader (Draco, KTX2, etc.)
  const { scene } = useGLTF(MODEL_PATH, true, true, configureLoader);

  // 1.1 Load the panoramic reflection texture
  const baseTexture = useTexture(TEXTURE_PATH);

  // Configure base texture for equirectangular reflection mapping
  useLayoutEffect(() => {
    baseTexture.mapping = THREE.EquirectangularReflectionMapping;
    baseTexture.colorSpace = THREE.SRGBColorSpace;
  }, [baseTexture]);

  // 2. Set up lights and the Neutral (RoomEnvironment) environment map
  useLayoutEffect(() => {
    // Increased ambient light for brighter buildings
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.35);
    ambientLight.name = "ambient_light";

    // Attach lights directly to the camera
    camera.add(ambientLight);

    // Compile RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();

    const roomEnv = new RoomEnvironment();
    const neutralTexture = pmremGenerator.fromScene(roomEnv).texture;

    threeScene.environment = neutralTexture;
    threeScene.environmentIntensity = 1; // Increased environment lighting intensity
    threeScene.background = null;

    // Cleanup: guarantees 100% removal and disposal of lights and textures
    return () => {
      camera.remove(ambientLight);
      ambientLight.dispose();

      threeScene.environment = null;
      threeScene.environmentIntensity = 1.0;
      neutralTexture.dispose();
      pmremGenerator.dispose();
    };
  }, [gl, threeScene, camera]);

  // 3. Clone the scene and configure meshes (PANO_Sphere, shadows, pointer events, reflections)
  const sceneClone = useMemo(() => {
    const clone = scene.clone();

    // Explicitly compute world matrices before traversing so localToWorld works
    clone.updateMatrixWorld(true);

    // Collect and configure all glass-related meshes
    clone.traverse((child) => {
      if (child.isMesh) {
        const name = child.name || "";
        if (name.includes("PANO_Sphere")) {
          // Sky dome does not cast/receive shadows or block pointer events
          child.castShadow = false;
          child.receiveShadow = false;
          child.raycast = () => null;
        } else {
          child.castShadow = true;
          child.receiveShadow = true;

          // Check if mesh has building glass/window materials
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          const hasGlass = materials.some((mat) => {
            const matName = mat?.name || "";
            return (
              matName === "GLASS" ||
              matName === "Win_Glass" ||
              matName === "Balcon_Glass"
            );
          });

          if (hasGlass) {
            // Apply simple HDR reflection map to GLASS and Win_Glass
            const enhanced = materials.map((mat) => {
              const matName = mat?.name || "";
              if (matName === "GLASS" || matName === "Win_Glass") {
                const cloned = mat.clone();
                if (cloned.color) cloned.color.set("#ffffff");
                cloned.envMap = baseTexture;
                cloned.envMapIntensity = 4.0;
                cloned.roughness = 0.0;
                cloned.metalness = 1.0;
                cloned.transparent = false;
                cloned.opacity = 1.0;
                return cloned;
              }
              return mat;
            });

            child.material = materials.length === 1 ? enhanced[0] : enhanced;
          }
        }
      }
    });

    return clone;
  }, [scene, baseTexture]);

  return {
    scene: sceneClone,
  };
};

export default useHomeScene;
