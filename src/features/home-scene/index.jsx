import {
  Fragment,
  memo,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
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
  const {
    scene,
    mergeVersion,
    tier1Ready,
    tier1FullyRevealed,
    tier2FullyRevealed,
  } = useHomeScene({
    active,
  });
  const { gl, scene: rootScene, camera } = useThree();

  // Hides the global loader the moment tier-1 (ground + all 7 buildings) is
  // visible, WITHOUT waiting for gl.compile() to finish (unlike
  // SceneReadyGate below). Root cause of the loader taking multiple seconds
  // even after chunking made the download itself fast: tier-1 still carries
  // ~200 unique materials, and compiling that many shader programs before
  // revealing anything is a real, multi-second cost on its own (see
  // SHADER_LINK_GRACE_MS's own doc comment — the same compile step existed
  // for the single-file model before this feature and was already slow for
  // the same reason). A single possibly-stuttery first frame is a far
  // better trade than a multi-second blank loading screen, so this
  // deliberately skips that wait.
  const firedOnTier1ReadyRef = useRef(false);
  useEffect(() => {
    if (!active || !tier1Ready || firedOnTier1ReadyRef.current) return;
    firedOnTier1ReadyRef.current = true;
    onReady?.();
  }, [active, tier1Ready, onReady]);

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
      <EnvironmentSetup
        modelScene={scene}
        modelVersion={mergeVersion}
        environmentRotation={environmentRotation}
        active={active}
      />

      {/* A fixed sun keeps the site lighting stable while the camera orbits. */}
      <SceneLights environmentRotationDeg={ENVIRONMENT_ROTATION_DEG} active={active} />

      <primitive object={scene} />

      {/* Gated on tier1FullyRevealed, not just `active`: BuildingMarkers
          renders all 7 A-G marker icons from FIXED positions the instant
          it mounts (features/building-markers/index.jsx has no per-
          building visibility check of its own) — mounting it while
          tier-1's staggered reveal (use-glb-chunks-loader.js) is still
          bringing buildings in one by one would show markers floating
          over buildings that haven't appeared yet. Waiting the extra
          ~0.4s for the full reveal to finish keeps markers and the
          buildings they point to in sync. */}
      {active && tier1FullyRevealed && <BuildingMarkers />}

      {/* Deliberately gated on tier2FullyRevealed (trees/amenities done
          trying to load AND, if they arrived, fully staggered into view —
          see use-glb-chunks-loader.js), not just `active`: the loader is
          already hidden by the tier1Ready effect above by the time this
          mounts, so its gl.compile() + grace-period wait (worthwhile once
          nothing else is going to arrive/change the material set again —
          avoids a stutter the next time the camera moves) no longer
          blocks anything user-visible. */}
      {active && tier2FullyRevealed && <SceneReadyGate onReady={onReady} />}

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
