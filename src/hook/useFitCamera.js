import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

export default function useFitCamera(objectRef, controlsRef) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!objectRef.current) return;

    const box = new THREE.Box3().setFromObject(objectRef.current);
    const sizeVec = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(sizeVec);
    box.getCenter(center);

    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

    // 📱 Responsive FOV
    const isMobile = size.width < 768;
    camera.fov = isMobile ? 60 : 45;
    camera.updateProjectionMatrix();

    // 📏 Distance calculation
    const fitHeightDistance =
      maxDim / (2 * Math.tan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;

    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.3;

    // 🎯 Set camera position
    camera.position.set(
      center.x + distance,
      center.y + distance * 0.6,
      center.z + distance,
    );

    // 🎯 Look at center
    camera.lookAt(center);

    // 🎮 OrbitControls sync
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.minDistance = distance * 0.6;
      controlsRef.current.maxDistance = distance * 2.5;
      controlsRef.current.update();
    }
  }, [objectRef, camera, size, controlsRef]);
}
