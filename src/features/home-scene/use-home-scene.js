import { useMemo, useRef } from "react";
import { useGLTF, useEnvironment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";
import { logger } from "@/utils/logger";

const MODEL_PATH = getAssetPath("/models/88-fixed.glb");
const SKY_HDR_PATH = getAssetPath("/hdr/sky-40m-compressed.exr");

/**
 * Allowlist of building glass material names from the GLB.
 * Only these materials receive the sky HDR envMap.
 * Excludes car windshields and other non-building glass.
 */
const BUILDING_GLASS_NAMES = new Set([
  "glass",
  "balcon_glass",
  "win_glass",
]);

const isBuildingGlass = (mat) => {
  const matName = (mat.name || "").toLowerCase();
  return BUILDING_GLASS_NAMES.has(matName);
};

export const useHomeScene = ({ controlsRef, onCameraChange }) => {
  // 1. Load the GLB model using the preconfigured loader (Draco, KTX2, etc.)
  const { scene } = useGLTF(MODEL_PATH, true, true, configureLoader);

  // 2. Load sky HDR environment map — used exclusively for glass reflections
  const skyEnvMap = useEnvironment({ files: SKY_HDR_PATH });

  // 3. Clone the scene and apply sky HDR only to glass materials
  const sceneClone = useMemo(() => {
    const clone = scene.clone();

    clone.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;

        // Apply sky HDR envMap only to glass materials
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          const updatedMaterials = materials.map((mat) => {
            if (
              (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) &&
              isBuildingGlass(mat)
            ) {
              const clonedMat = mat.clone();
              // Override per-material envMap with sky HDR (overrides scene.environment)
              clonedMat.envMap = skyEnvMap;
              // Boost envMapIntensity so sky reflection is clearly visible
              clonedMat.envMapIntensity = 2.5;
              // Force high metalness — non-metallic glass (metallic=0) has almost no
              // reflection at normal viewing angles due to Fresnel. Setting metalness
              // high ensures the sky HDR is visible from all angles, not just grazing.
              clonedMat.metalness = 0.9;
              // Keep roughness very low for sharp, mirror-like sky reflections
              clonedMat.roughness = 0.0;
              clonedMat.needsUpdate = true;
              logger.info(
                `[useHomeScene] Sky HDR applied to glass: ${mat.name} (mesh: ${child.name})`
              );
              return clonedMat;
            }
            return mat;
          });

          child.material = Array.isArray(child.material)
            ? updatedMaterials
            : updatedMaterials[0];
        }
      }
    });

    return clone;
  }, [scene, skyEnvMap]);

  // 4. Compute combined bounding box of non-huge meshes to focus OrbitControls on the overall scene center
  const focusData = useMemo(() => {
    const combinedBox = new THREE.Box3();
    let hasContent = false;
    const meshDetails = [];

    sceneClone.traverse((child) => {
      if (child.isMesh) {
        child.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(child);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const nameLower = child.name.toLowerCase();
        const isSkyOrDome = nameLower.includes("sky") || nameLower.includes("dome") || nameLower.includes("sphere") || nameLower.includes("cloud") || nameLower.includes("panorama");
        
        // Skip huge meshes (like sky dome / panorama spheres or giant planes)
        if (maxDim < 250 && !isSkyOrDome) {
          combinedBox.union(box);
          hasContent = true;
          if (meshDetails.length < 30) {
            meshDetails.push({
              name: child.name,
              size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
              center: [box.getCenter(new THREE.Vector3()).x.toFixed(2), box.getCenter(new THREE.Vector3()).y.toFixed(2), box.getCenter(new THREE.Vector3()).z.toFixed(2)]
            });
          }
        } else {
          logger.info(
            `[useHomeScene] Huge mesh skipped: ${child.name} size: [${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}] center: [${box.getCenter(new THREE.Vector3()).x.toFixed(2)}, ${box.getCenter(new THREE.Vector3()).y.toFixed(2)}, ${box.getCenter(new THREE.Vector3()).z.toFixed(2)}]`
          );
        }
      }
    });

    if (hasContent) {
      const center = new THREE.Vector3();
      combinedBox.getCenter(center);
      const size = new THREE.Vector3();
      combinedBox.getSize(size);
      logger.info(
        `[useHomeScene] Computed combined box center: [${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}] size: [${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}]`
      );
      if (import.meta.env.DEV) {
        logger.info("[useHomeScene] Sample meshes: " + JSON.stringify(meshDetails.slice(0, 20)));
      }
      return {
        center: [center.x, center.y, center.z],
        size: [size.x, size.y, size.z],
        found: true,
      };
    }

    // Fallback if not found
    return {
      center: [-8.06, -30.14, -24.8],
      size: [10, 10, 10],
      found: false,
    };
  }, [sceneClone]);

  // Ref to track last coordinates to avoid redundant callbacks
  const lastCoordsRef = useRef("");

  // 5. Update HUD coordinates in Dev mode during controls updates
  useFrame(({ camera }) => {
    if (!onCameraChange || !import.meta.env.DEV) return;

    const currentPos = camera.position;
    const currentTarget = controlsRef.current?.target || new THREE.Vector3();

    const coordsStr = `${currentPos.x.toFixed(2)},${currentPos.y.toFixed(2)},${currentPos.z.toFixed(2)}|${currentTarget.x.toFixed(2)},${currentTarget.y.toFixed(2)},${currentTarget.z.toFixed(2)}`;

    if (coordsStr !== lastCoordsRef.current) {
      lastCoordsRef.current = coordsStr;
      onCameraChange({
        position: [
          parseFloat(currentPos.x.toFixed(2)),
          parseFloat(currentPos.y.toFixed(2)),
          parseFloat(currentPos.z.toFixed(2)),
        ],
        target: [
          parseFloat(currentTarget.x.toFixed(2)),
          parseFloat(currentTarget.y.toFixed(2)),
          parseFloat(currentTarget.z.toFixed(2)),
        ],
      });
    }
  });

  return {
    scene: sceneClone,
    focusCenter: focusData.center,
    focusFound: focusData.found,
  };
};

export default useHomeScene;
