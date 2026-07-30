import { Fragment, useMemo } from "react";
import * as THREE from "three";
import useHomeScene from "./use-home-scene";
import EnvironmentSetup from "./environment-setup";
import CameraRig from "./camera-rig";
import SceneLights from "./scene-lights";
import SceneReadyGate from "./scene-ready-gate";

// The GLB carries no lights at all, so illumination is IBL from the panorama plus
// the fixed world-space sun in scene-lights.jsx.
//
// 1° matches the "Env rotation: 1°" of the gltfeditor reference render. Rotating
// the environment turns every reflection together, and the sun is placed relative
// to it so the highlight direction stays consistent with the sky.
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

      {/* IBL from 80m-nano-green.jpg — drives the window reflections. */}
      <EnvironmentSetup environmentRotation={environmentRotation} />

      {/* Fixed world-space sun + ambient fill. Deliberately not parented to the
          camera: a camera-parented light acts as a headlight, so every vertical
          drag re-lit the entire scene. */}
      <SceneLights environmentRotationDeg={ENVIRONMENT_ROTATION_DEG} />

      <primitive object={scene} />

      {/* Mounted last so the scene graph is complete before warm-up compiles it. */}
      <SceneReadyGate onReady={onReady} />
    </Fragment>
  );
};

export default HomeScene;
