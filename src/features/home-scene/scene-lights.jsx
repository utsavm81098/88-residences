import { Fragment, memo, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
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
const SceneLights = ({ environmentRotationDeg = 0, active = true }) => {
  // Dynamic shadow mapping across this 2,431-mesh model causes temporal shadow crawling/shimmer
  // during camera movement and roughly doubles draw calls. Disabling dynamic shadows matches
  // the glTF editor baseline and delivers rock-solid 60 FPS performance.
  const castShadow = false;

  const sunTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(...HOME_CAMERA.target);
    return target;
  }, []);

  useLayoutEffect(() => {
    if (!active) return;
    sunTarget.position.set(...HOME_CAMERA.target);
    sunTarget.updateMatrixWorld(true);
    sunTarget.matrixWorldNeedsUpdate = true;
  }, [sunTarget, active]);

  useFrame(() => {
    if (!active) return;
    sunTarget.position.set(...HOME_CAMERA.target);
    sunTarget.updateMatrixWorld(true);
  });

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

      {/* Ambient Light: Pure white 0.45 matches glTF Viewer ambient settings */}
      <ambientLight color="#ffffff" intensity={0.45} />

      {/* Primary Directional Light (Sun): Focused shadow camera bounds to eliminate shadow aliasing and self-shadow acne */}
      <directionalLight
        position={sunPosition}
        target={sunTarget}
        color="#ffffff"
        intensity={2.2}
        castShadow={castShadow}
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

// Memoized: environmentRotationDeg is passed as the module-level
// ENVIRONMENT_ROTATION_DEG constant from HomeScene (a primitive, stable by
// value), so this bails out of re-rendering whenever HomeSceneImpl does for
// a reason unrelated to this component — same pattern already used for
// HomeScene/CameraRig/BuildingMarkers/EnvironmentSetup.
export default memo(SceneLights);
