import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

const DEVICE_CONFIG = {
  mobile: {
    offset: 1.5,
    zoomRangeFactor: 0.25,
    minDistance: 60,
    maxDistance: 140,
  },
  tablet: {
    offset: 1.5,
    zoomRangeFactor: 0.3,
    minDistance: 50,
    maxDistance: 130,
  },
  desktop: {
    offset: 1.3,
    zoomRangeFactor: 0.4,
    minDistance: 40,
    maxDistance: 80,
  },
};

function getDeviceConfig(width) {
  if (width < BREAKPOINTS.mobile) return DEVICE_CONFIG.mobile;
  if (width < BREAKPOINTS.tablet) return DEVICE_CONFIG.tablet;
  return DEVICE_CONFIG.desktop;
}

// ✅ Reusable THREE objects — allocated once, never recreated on each render
const _box = new THREE.Box3();
const _sphere = new THREE.Sphere();
const _center = new THREE.Vector3();
const _dir = new THREE.Vector3();

export default function useFitCamera(modelRef, controlsRef) {
  const { camera, size: viewportSize, invalidate } = useThree();

  useEffect(() => {
    const object = modelRef?.current;
    const controls = controlsRef?.current;
    if (!object) return;

    const { offset, zoomRangeFactor, minDistance, maxDistance } =
      getDeviceConfig(viewportSize.width);

    // ✅ Reuse pre-allocated objects instead of new THREE.* every call
    _box.setFromObject(object);
    _box.getCenter(_center);
    _box.getBoundingSphere(_sphere);

    // ✅ Use the tighter FOV axis so model always fits portrait + landscape
    const fovV = camera.fov * (Math.PI / 180);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
    const cameraDistance =
      (_sphere.radius / Math.sin(Math.min(fovV, fovH) / 2)) * offset;

    // ✅ Reuse _dir instead of cloning camera.position
    _dir
      .copy(camera.position)
      .sub(_center)
      .normalize()
      .multiplyScalar(cameraDistance);

    camera.position.copy(_center).add(_dir);
    camera.near = 0.1;
    camera.far = 2000;
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(_center);

      const zoomRange = cameraDistance * zoomRangeFactor;
      controls.minDistance = minDistance ?? cameraDistance - zoomRange;
      controls.maxDistance = maxDistance ?? cameraDistance + zoomRange;

      controls.update();
      controls.saveState();
    }

    invalidate();
  }, [viewportSize, camera, modelRef, controlsRef]);
}
