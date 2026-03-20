import { useMemo } from "react";
import * as THREE from "three";

export default function useHDRSunSync(rotationY = 0) {
  return useMemo(() => {
    // Base sun direction (sunset style)
    const baseSunDir = new THREE.Vector3(1, 1, 0.5).normalize();

    // Rotate based on HDR rotation
    const matrix = new THREE.Matrix4().makeRotationY(rotationY);
    const sunDirection = baseSunDir.clone().applyMatrix4(matrix);

    // Convert direction → position
    const sunPosition = sunDirection.clone().multiplyScalar(50);

    return { sunDirection, sunPosition };
  }, [rotationY]);
}
