import { Fragment, useMemo } from "react";
import * as THREE from "three";
import { HOME_CAMERA } from "@/utils/constant";

// Measured sun position matching the PANO_Sphere dome emissive sun disc
const PANORAMA_SUN_AZIMUTH_DEG = 200.0;
const PANORAMA_SUN_ELEVATION_DEG = 60.0;
const SUN_RADIUS = 400;

/**
 * Clean outdoor lighting matching Don McCurdy's glTF Viewer:
 * - Direct Light: pure white (#ffffff), intensity 2.2, castShadow
 * - Ambient Light: pure white (#ffffff), intensity 0.3
 */
const SceneLights = ({ environmentRotationDeg = 0 }) => {
  const sunTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(...HOME_CAMERA.target);
    return target;
  }, []);

  const sunPosition = useMemo(() => {
    const elevation = THREE.MathUtils.degToRad(PANORAMA_SUN_ELEVATION_DEG);
    const azimuth = THREE.MathUtils.degToRad(
      PANORAMA_SUN_AZIMUTH_DEG + environmentRotationDeg,
    );

    return [
      SUN_RADIUS * Math.cos(elevation) * Math.sin(azimuth),
      SUN_RADIUS * Math.sin(elevation),
      SUN_RADIUS * Math.cos(elevation) * Math.cos(azimuth),
    ];
  }, [environmentRotationDeg]);

  return (
    <Fragment>
      <primitive object={sunTarget} />

      {/* Ambient Light: Pure white 0.3 matches glTF Viewer ambient settings */}
      <ambientLight color="#ffffff" intensity={0.3} />

      {/* Primary Directional Light (Sun): Focused shadow camera bounds to eliminate shadow aliasing and self-shadow acne */}
      <directionalLight
        position={sunPosition}
        target={sunTarget}
        color="#ffffff"
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-110}
        shadow-camera-right={110}
        shadow-camera-top={110}
        shadow-camera-bottom={-110}
        shadow-camera-near={10}
        shadow-camera-far={700}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />
    </Fragment>
  );
};

export default SceneLights;
