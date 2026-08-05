import { useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { HOME_ENV_PATH } from "@/utils/constant";

// Strictly target actual glass/window materials (prevents concrete/metal parts from turning green)
const GLASS_MATERIALS_RE =
  /glass|win_glass|material__2558|material__2556|window/i;

/**
 * Applies the 80m-nano-green.jpg panorama texture directly as an equirectangular environment reflection map
 * exclusively to target window/glass/balcony/railing nodes.
 * Non-matching nodes have envMap set to null so they do not receive environment reflections.
 */
const EnvironmentSetup = ({ environmentRotation }) => {
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const panorama = useLoader(THREE.TextureLoader, HOME_ENV_PATH);

  useEffect(() => {
    if (!panorama) return undefined;

    panorama.mapping = THREE.EquirectangularReflectionMapping;
    panorama.colorSpace = THREE.SRGBColorSpace;
    panorama.needsUpdate = true;

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(panorama).texture;
    pmremGenerator.dispose();

    // Do NOT set scene.environment or scene.background globally.
    scene.environment = null;
    scene.background = null;

    console.log(
      "[EnvironmentSetup] Starting traversal. GLASS_MATERIALS_RE:",
      GLASS_MATERIALS_RE,
    );
    let matchedCount = 0;
    scene.traverse((child) => {
      if (!child.isMesh && !child.isInstancedMesh) return;
      const childName = child.name || "";
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        if (!material) return;

        const materialName = material.name || "";
        const isTarget =
          GLASS_MATERIALS_RE.test(materialName) ||
          GLASS_MATERIALS_RE.test(childName);

        if (isTarget) {
          matchedCount++;
          const isPbr =
            material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;

          if (isPbr) {
            // Clone the material if it hasn't been cloned yet to prevent side-effects on shared meshes
            let targetMaterial = material;
            if (!material.name.includes("_cloned")) {
              targetMaterial = material.clone();
              targetMaterial.name = material.name + "_cloned";
              if (Array.isArray(child.material)) {
                child.material[index] = targetMaterial;
              } else {
                child.material = targetMaterial;
              }
            }

            // Configure window glass as a reflective mirror to show the green reflection clearly
            targetMaterial.envMap = envMap;
            targetMaterial.envMapIntensity = 1.0; // Reduced intensity
            targetMaterial.roughness = 0.05; // Softer reflection
            targetMaterial.metalness = 0.95; // Highly reflective
            targetMaterial.transparent = false; // Block the blue sky dome behind it
            targetMaterial.opacity = 1.0;
            targetMaterial.color.set("#ffffff"); // Neutral color so reflection colors are pure
            targetMaterial.needsUpdate = true;
          }
        } else {
          if (material.envMap) {
            material.envMap = null;
            material.envMapIntensity = 0;
            material.needsUpdate = true;
          }
        }
      });
    });
    console.log(
      `[EnvironmentSetup] Traversal finished. Matched targets: ${matchedCount}`,
    );

    invalidate();

    return () => {
      scene.traverse((child) => {
        if (!child.isMesh && !child.isInstancedMesh) return;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((m) => {
          if (m?.envMap === envMap) {
            m.envMap = null;
            m.needsUpdate = true;
          }
        });
      });
      envMap.dispose();
    };
  }, [environmentRotation, gl, invalidate, panorama, scene]);

  return null;
};

export default EnvironmentSetup;
