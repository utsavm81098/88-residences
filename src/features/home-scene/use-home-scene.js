import { useMemo, useEffect, useRef } from "react";
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
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          
          const mappedMaterials = materials.map((mat) => {
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              const clonedMat = mat.clone();

              const matName = (mat.name || "").toLowerCase();
              const meshName = (child.name || "").toLowerCase();

              // Glass materials must remain glossy and reflective
              const isGlass =
                mat.transparent ||
                mat.opacity < 1.0 ||
                matName.includes("glass") ||
                matName.includes("window") ||
                matName.includes("glazing") ||
                meshName.includes("glass") ||
                meshName.includes("window") ||
                meshName.includes("glazing") ||
                (clonedMat.transmission !== undefined && clonedMat.transmission > 0);

              // Metallic materials must remain reflective
              const isMetal =
                matName.includes("metal") ||
                matName.includes("aluminium") ||
                meshName.includes("metal") ||
                clonedMat.metalness > 0.5 ||
                child.name === "Box028";

              // Robust classification: any material that is not glass, and not metal, is structural.
              // In addition, any metal part explicitly named "big" (window frame) or "railing" is matte (structural).
              const isStructural =
                !isGlass &&
                (!isMetal || matName.includes("big") || matName.includes("railing") || meshName.includes("railing"));

              if (isStructural) {
                // Structural surfaces: concrete walls, floors, pillars, ceilings, stone, grass, roads, etc.
                // Force envMapIntensity to 0.0 to completely eliminate HDR reflections/color cast (no "HDR shadows")
                clonedMat.envMapIntensity = 0.0;
                clonedMat.roughness = Math.max(clonedMat.roughness, 0.7);
              } else {
                // Glass, metal, and other designed reflective materials get rich reflections from scene.environment automatically.
                if (isGlass) {
                  // Glass: crystal-clear reflections (roughness=0 for sharp HDR)
                  clonedMat.envMapIntensity = 2.0;
                  clonedMat.roughness = 0.0;
                  clonedMat.transparent = true;
                  clonedMat.needsUpdate = true;
                } else {
                  // Metals or other shiny parts
                  clonedMat.envMapIntensity = 1.0;
                  clonedMat.roughness = Math.min(clonedMat.roughness, 0.1);
                }
              }
              
              // Enable flat shading on Box028 to prevent wavy/distorted reflections
              if (child.name === "Box028") {
                clonedMat.flatShading = true;
                clonedMat.roughness = 0.0;
                clonedMat.metalness = 1.0;
                clonedMat.needsUpdate = true;
              }
              return clonedMat;
            }
            return mat;
          });
          
          child.material = Array.isArray(child.material)
            ? mappedMaterials
            : mappedMaterials[0];
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
