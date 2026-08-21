import { Fragment, memo, useMemo, useEffect, useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import useHomeScene from "./use-home-scene";
import CameraRig from "./camera-rig";
import SceneLights from "./scene-lights";
import SceneReadyGate from "@/features/scene-ready-gate";
import BuildingMarkers from "@/features/building-markers";
import EnvironmentSetup from "./environment-setup";
import { solveFraming } from "./fit-camera";
import { HOME_CAMERA, HOME_EXPOSURE } from "@/utils/constant";

// Keep the reflection panorama in the same orientation as the panoramic dome
// baked into the supplied GLB. The dome remains the visible background.
const ENVIRONMENT_ROTATION_DEG = 1;

const HomeSceneImpl = ({ controlsRef, onReady, active = true }) => {
  const { scene } = useHomeScene();
  const { gl, scene: rootScene, camera } = useThree();

  useLayoutEffect(() => {
    if (!active || !camera) return;
    const aspect =
      typeof window === "undefined"
        ? HOME_CAMERA.baseAspect
        : window.innerWidth / Math.max(window.innerHeight, 1);
    const framing = solveFraming({ camera: HOME_CAMERA, aspect });
    if (framing) {
      camera.position.set(...framing.position);
      camera.fov = framing.fov;
      camera.near = HOME_CAMERA.near;
      camera.far = HOME_CAMERA.far;
      camera.lookAt(...HOME_CAMERA.target);
      camera.updateProjectionMatrix();
    }
  }, [active, camera]);

  useEffect(() => {
    if (!active || !gl) return;
    if (rootScene.fog) rootScene.fog = null;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = Math.pow(2, HOME_EXPOSURE);
    gl.needsUpdate = true;
  }, [gl, rootScene, active]);

  const environmentRotation = useMemo(
    () => [0, THREE.MathUtils.degToRad(ENVIRONMENT_ROTATION_DEG), 0],
    [],
  );

  // Model is still downloading/parsing (useGLBLoader, not Suspense — see
  // use-home-scene.js). Mirrors what the removed Suspense boundary used to do
  // for this subtree: nothing here mounts until the GLB is ready.
  if (!scene) return null;

  return (
    <Fragment>
      {/* No <AdaptiveDpr /> and no <PerformanceMonitor /> here, deliberately.
          PerformanceMonitor's perf factor STARTS at 0.5 and AdaptiveDpr multiplies
          the device pixel ratio by it, so the canvas opened at half resolution and
          needed ~12.5s of good framerate (10 samples x 250ms per 0.1 step) to
          reach full res. That was the blurry-then-sharpens first render. This is a
          static architectural view, so a fixed dpr is the right trade. */}

      {active && <CameraRig controlsRef={controlsRef} active={active} />}

      {/* Low-energy image-based lighting restores natural sky bounce on shaded
          facades without replacing the GLB's own panorama sphere. */}
      <EnvironmentSetup modelScene={scene} environmentRotation={environmentRotation} active={active} />

      {/* A fixed sun keeps the site lighting stable while the camera orbits. */}
      <SceneLights environmentRotationDeg={ENVIRONMENT_ROTATION_DEG} active={active} />

      <primitive object={scene} />

      {/* Display SVG markers on top of each of the 7 buildings in the masterplan scene only when Home is active */}
      {active && <BuildingMarkers />}

      {/* Mounted last so the scene graph is complete before warm-up compiles it. */}
      {active && <SceneReadyGate onReady={onReady} />}

      {/* EffectComposer + FXAA removed: native hardware MSAA (antialias:true in
          getHomeGlConfig) is now restored on the canvas. Native MSAA provides
          geometrically-accurate sub-pixel coverage for all geometry edges —
          building facades, tree silhouettes, road lines — and is required for
          alphaToCoverage to function on leaf-cutout foliage materials (see
          use-home-scene.js's isLeafCutout branch). With MSAA active, FXAA would
          be a redundant screen-space blur pass: an extra full-scene render through
          an offscreen render target plus a blit, with no quality improvement over
          what MSAA already provides. The previous EffectComposer also used
          multisampling={0} (1-sample offscreen target) which meant alphaToCoverage
          had no MSAA samples to work with even when native MSAA was present —
          removing it unblocks the fix entirely. */}
    </Fragment>
  );
};

// Memoized: controlsRef/onReady are stable references from useHome (useRef
// and useCallback([]) respectively), so this — and by extension CameraRig,
// BuildingMarkers, EnvironmentSetup, everything in this subtree — bails out
// of re-rendering when HomeContainer re-renders for a reason that has
// nothing to do with this scene.
export const HomeScene = memo(HomeSceneImpl);

export default HomeScene;
