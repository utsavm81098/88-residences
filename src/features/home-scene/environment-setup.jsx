import { useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOME_ENV_PATH } from "@/utils/constant";

// Target window/glass materials for mirror-like panorama reflection
const GLASS_MATERIALS_RE =
  /glass|win_glass|material__2558|material__2556|window/i;

/**
 * Applies neutral RoomEnvironment IBL for overall scene lighting (so shadows and foliage
 * stay bright and natural), while specifically applying the 80m-nano-green.jpg HDR panorama
 * reflection to building window glass materials.
 */
const EnvironmentSetup = () => {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const panorama = useLoader(THREE.TextureLoader, HOME_ENV_PATH);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();

    // 1. Generate 80m-nano-green.jpg PMREM map for window glass reflections
    let greenEnvMap = null;
    if (panorama) {
      panorama.mapping = THREE.EquirectangularReflectionMapping;
      panorama.colorSpace = THREE.SRGBColorSpace;
      panorama.needsUpdate = true;
      greenEnvMap = pmremGenerator.fromEquirectangular(panorama).texture;
    }

    // 2. Generate Neutral RoomEnvironment PMREM map for clean global IBL
    const roomEnv = new RoomEnvironment(gl);
    const neutralEnvMap = pmremGenerator.fromScene(roomEnv).texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // Set global scene environment to neutral for clean 360° lighting
    scene.environment = neutralEnvMap;
    scene.background = null;

    // Apply greenEnvMap specifically to window glass, and boost envMapIntensity for foliage
    scene.traverse((child) => {
      if (!child.isMesh && !child.isInstancedMesh) return;
      const childName = child.name || "";
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        if (!material) return;

        const materialName = material.name || "";
        const isGlass =
          GLASS_MATERIALS_RE.test(materialName) ||
          GLASS_MATERIALS_RE.test(childName);

        if (isGlass) {
          const isPbr =
            material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;

          if (isPbr) {
            let targetMaterial = material;
            if (!material.name.includes("_cloned")) {
              targetMaterial = material.clone();
              targetMaterial.name = material.name + "_cloned";
              targetMaterial.userData.__originalMaterial = material;
              targetMaterial.userData.__isClonedByEnvSetup = true;
              if (Array.isArray(child.material)) {
                child.material[index] = targetMaterial;
              } else {
                child.material = targetMaterial;
              }
            }

            // Window glass receives the 80m-nano-green panorama environment reflection
            targetMaterial.envMap = greenEnvMap || neutralEnvMap;
            targetMaterial.envMapIntensity = 1.0;
            targetMaterial.roughness = 0.05;
            targetMaterial.metalness = 0.95;
            targetMaterial.transparent = false;
            targetMaterial.opacity = 1.0;
            targetMaterial.color.set("#ffffff");
            targetMaterial.needsUpdate = true;
          }
        }
      });
    });

    invalidate();

    return () => {
      scene.environment = null;

      scene.traverse((child) => {
        if (!child.isMesh && !child.isInstancedMesh) return;
        if (!child.material) return;

        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat, idx) => {
          if (!mat) return;

          if (mat.envMap === greenEnvMap || mat.envMap === neutralEnvMap) {
            mat.envMap = null;
            mat.needsUpdate = true;
          }

          if (mat.userData?.__isClonedByEnvSetup) {
            if (mat.userData.__originalMaterial) {
              if (Array.isArray(child.material)) {
                child.material[idx] = mat.userData.__originalMaterial;
              } else {
                child.material = mat.userData.__originalMaterial;
              }
            }
            mat.dispose();
          }
        });
      });

      if (greenEnvMap) greenEnvMap.dispose();
      neutralEnvMap.dispose();
    };
  }, [gl, invalidate, panorama, scene]);

  return null;
};

export default EnvironmentSetup;
