import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";
import { logger } from "@/utils/logger";

const MODEL_PATH = getAssetPath("/models/88-fixed.glb");

export const useHomeScene = ({ controlsRef, onCameraChange }) => {
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

        // Ensure standard materials reflect the environment HDR map
        if (child.material) {
        }
      }
    });

    return clone;
  }, [scene]);

  // 3. Compute combined bounding box of non-huge meshes to focus OrbitControls on the overall scene center
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
        const isSkyOrDome =
          nameLower.includes("sky") ||
          nameLower.includes("dome") ||
          nameLower.includes("sphere") ||
          nameLower.includes("cloud") ||
          nameLower.includes("panorama");

        // Skip huge meshes (like sky dome / panorama spheres or giant planes)
        if (maxDim < 250 && !isSkyOrDome) {
          combinedBox.union(box);
          hasContent = true;
          if (meshDetails.length < 30) {
            meshDetails.push({
              name: child.name,
              size: [size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2)],
              center: [
                box.getCenter(new THREE.Vector3()).x.toFixed(2),
                box.getCenter(new THREE.Vector3()).y.toFixed(2),
                box.getCenter(new THREE.Vector3()).z.toFixed(2),
              ],
            });
          }
        } else {
          logger.info(
            `[useHomeScene] Huge mesh skipped: ${child.name} size: [${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}] center: [${box.getCenter(new THREE.Vector3()).x.toFixed(2)}, ${box.getCenter(new THREE.Vector3()).y.toFixed(2)}, ${box.getCenter(new THREE.Vector3()).z.toFixed(2)}]`,
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
        `[useHomeScene] Computed combined box center: [${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}] size: [${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}]`,
      );
      if (import.meta.env.DEV) {
        logger.info(
          "[useHomeScene] Sample meshes: " +
            JSON.stringify(meshDetails.slice(0, 20)),
        );
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

  // 4. Update HUD coordinates in Dev mode during controls updates
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
