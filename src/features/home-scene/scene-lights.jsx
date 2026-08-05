import { Fragment, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { HOME_CAMERA } from "@/utils/constant";

// Measured from the gITF Viewer screenshot of 88RES-06-final-trees.glb:
// The PANO_Sphere dome's emissive sun disc sits at world-space
//   Azimuth   ≈ 200 °  (SSW — south-southwest)
//   Elevation ≈ 60 °   (high afternoon sun, clearly above 45 °)
//
// The initial home-scene camera faces NNW (azimuth ≈ -116 °).
// At azimuth 200 ° the sun appears centre-to-slightly-left of the view,
// which matches its position in the screenshot.
// If shadows still look slightly off after a hot-reload, nudge AZIMUTH ± 10 °
// and/or ELEVATION ± 5 ° in small steps.
const PANORAMA_SUN_AZIMUTH_DEG = 200.0;
const PANORAMA_SUN_ELEVATION_DEG = 60.0;
const SUN_RADIUS = 400;

/**
 * Outdoor architectural lighting with a single, stable sun. The prior strong
 * sun, hemisphere, ambient, and second directional fill added together and
 * were clipping the model's landscape and facade detail.
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

      {/* Daylight bounce opens up shaded elevations without flattening the
          sunlit facades or bleaching vegetation. */}
      <hemisphereLight
        skyColor="#dbe9f8"
        groundColor="#596653"
        intensity={0.65}
      />
      <ambientLight color="#edf3f8" intensity={0.33} />

      <directionalLight
        position={sunPosition}
        target={sunTarget}
        color="#fff3e2"
        intensity={2.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-230}
        shadow-camera-right={230}
        shadow-camera-top={230}
        shadow-camera-bottom={-230}
        shadow-camera-near={10}
        shadow-camera-far={700}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
      />

      {/* Cool, shadowless bounce light: it gently reveals the side of each
          building that faces away from the sun, with no second shadow system. */}
      <directionalLight
        position={[-sunPosition[0], SUN_RADIUS * 0.55, -sunPosition[2]]}
        target={sunTarget}
        color="#dce9f5"
        intensity={0.4}
      />
    </Fragment>
  );
};

export default SceneLights;
