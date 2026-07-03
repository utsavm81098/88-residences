import { useMemo, useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { configureLoader } from "@/utils/preloader";
import { getAssetPath } from "@/utils/constant";

const MODEL_PATH = getAssetPath("/models/big-scene.glb");

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
              clonedMat.envMapIntensity = 1.2;
              
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

  // 3. Find Box028 to focus OrbitControls on it
  const focusData = useMemo(() => {
    let targetMesh = null;
    sceneClone.traverse((child) => {
      if (child.isMesh && child.name === "Box028") {
        targetMesh = child;
      }
    });

    if (targetMesh) {
      targetMesh.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(targetMesh);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      
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
