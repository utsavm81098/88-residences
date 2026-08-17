import { memo, useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOME_ENV_PATH } from "@/utils/constant";

// Target window/glass materials for mirror-like panorama reflection
const GLASS_MATERIALS_RE =
  /glass|win_glass|material__2558|material__2556|window/i;

// Nodes whose names contain "GLASS" (or whose materials match the regex) but
// are NOT building window panes — they must NOT receive the HDR mirror treatment.
// • GLASS_Line*   → pool/water-edge geometry
// • Obj_RAILING*  → balcony glass railing panels (get their own transparent treatment
//                   in use-home-scene.js instead)
const GLASS_NODE_EXCLUSION_RE = /^GLASS_Line|^Obj_RAILING/i;

/**
 * Applies neutral RoomEnvironment IBL for overall scene lighting (so shadows and foliage
 * stay bright and natural), while specifically applying the 80m-nano-green.jpg HDR panorama
 * reflection to building window glass materials.
 */
const EnvironmentSetup = ({ environmentRotation }) => {
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

      // Align this reflection panorama's horizontal orientation with the
      // panoramic dome baked into the GLB (see environmentRotation's own
      // comment in home-scene/index.jsx). An equirectangular texture's
      // horizontal rotation is a wrap-around horizontal offset, not a
      // rotation matrix — RepeatWrapping is required for that offset to
      // wrap instead of clamping/stretching at the seam.
      const rotationY = environmentRotation?.[1] ?? 0;
      if (rotationY) {
        panorama.wrapS = THREE.RepeatWrapping;
        panorama.offset.x = rotationY / (2 * Math.PI);
      }

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

    // Apply greenEnvMap specifically to window glass
    const clonedMaterialsCache = new Map();

    scene.traverse((child) => {
      if (!child.isMesh && !child.isInstancedMesh) return;
      const childName = child.name || "";
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        if (!material) return;

        const materialName = material.name || "";
        // Exclude GLASS_Line* nodes (pool/water edge geometry) — they match the
        // broad child-name regex but must NOT receive the HDR panorama treatment.
        const isExcludedGlassNode = GLASS_NODE_EXCLUSION_RE.test(childName);

        const isGlass =
          !isExcludedGlassNode &&
          (GLASS_MATERIALS_RE.test(materialName) ||
            GLASS_MATERIALS_RE.test(childName));

        if (isGlass) {
          const isPbr =
            material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;

          if (isPbr) {
            let targetMaterial = material;
            if (material.userData?.__isClonedByEnvSetup) {
              material.envMap = greenEnvMap || neutralEnvMap;
              material.envMapIntensity = 1.5;
              if (material.isMeshPhysicalMaterial) {
                material.transmission = 0;
                material.thickness = 0;
              }
              material.needsUpdate = true;
            } else {
              if (clonedMaterialsCache.has(material)) {
                targetMaterial = clonedMaterialsCache.get(material);
              } else {
                targetMaterial = material.clone();
                targetMaterial.name = (material.name || "glass") + "_cloned";
                targetMaterial.userData.__originalMaterial = material;
                targetMaterial.userData.__isClonedByEnvSetup = true;

                // Disable physical transmission so Three.js renders crisp PBR reflections
                // instead of an unpopulated refraction buffer (which renders pitch black).
                if (targetMaterial.isMeshPhysicalMaterial) {
                  targetMaterial.transmission = 0;
                  targetMaterial.thickness = 0;
                }

                // Window glass receives the 80m-nano-green panorama environment reflection
                targetMaterial.envMap = greenEnvMap || neutralEnvMap;
                targetMaterial.envMapIntensity = 1.5;
                targetMaterial.roughness = 0.05;
                targetMaterial.metalness = 0.9;
                targetMaterial.transparent = false;
                targetMaterial.opacity = 1.0;
                targetMaterial.color.set("#ffffff");
                targetMaterial.needsUpdate = true;

                clonedMaterialsCache.set(material, targetMaterial);
              }

              if (Array.isArray(child.material)) {
                child.material[index] = targetMaterial;
              } else {
                child.material = targetMaterial;
              }
            }
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
  }, [gl, invalidate, panorama, scene, environmentRotation]);

  return null;
};

// Memoized: environmentRotation is a stable, empty-deps useMemo array from
// HomeScene, so this bails out of re-rendering whenever HomeSceneImpl does
// for a reason unrelated to this component (e.g. the isMobile breakpoint
// crossing) — same pattern already used for HomeScene/CameraRig/BuildingMarkers.
export default memo(EnvironmentSetup);
