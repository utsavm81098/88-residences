import { Fragment, useMemo } from "react";
import * as THREE from "three";
import useHomeScene from "./use-home-scene";
import CameraRig from "./camera-rig";
import SceneLights from "./scene-lights";
import SceneReadyGate from "./scene-ready-gate";
import BuildingMarkers from "@/features/building-markers";
import EnvironmentSetup from "./environment-setup";

// Keep the reflection panorama in the same orientation as the panoramic dome
// baked into the supplied GLB. The dome remains the visible background.
const ENVIRONMENT_ROTATION_DEG = 1;

export const HomeScene = ({ controlsRef, onReady }) => {
  const { scene } = useHomeScene();
  const environmentRotation = useMemo(
    () => [0, THREE.MathUtils.degToRad(ENVIRONMENT_ROTATION_DEG), 0],
    [],
  );

  return (
    <Fragment>
      {/* No <AdaptiveDpr /> and no <PerformanceMonitor /> here, deliberately.
          PerformanceMonitor's perf factor STARTS at 0.5 and AdaptiveDpr multiplies
          the device pixel ratio by it, so the canvas opened at half resolution and
          needed ~12.5s of good framerate (10 samples x 250ms per 0.1 step) to
          reach full res. That was the blurry-then-sharpens first render. This is a
          static architectural view, so a fixed dpr is the right trade. */}

      <CameraRig controlsRef={controlsRef} />

      {/* Low-energy image-based lighting restores natural sky bounce on shaded
          facades without replacing the GLB's own panorama sphere. */}
      <EnvironmentSetup environmentRotation={environmentRotation} />

      {/* A fixed sun keeps the site lighting stable while the camera orbits. */}
      <SceneLights environmentRotationDeg={ENVIRONMENT_ROTATION_DEG} />

      <primitive object={scene} />

      {/* Display SVG markers on top of each of the 7 buildings in the masterplan scene */}
      <BuildingMarkers />

      {/* Mounted last so the scene graph is complete before warm-up compiles it. */}
      <SceneReadyGate onReady={onReady} />
    </Fragment>
  );
};

export default HomeScene;
