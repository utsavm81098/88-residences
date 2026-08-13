import { Fragment, memo, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "@react-three/postprocessing";
import useHomeScene from "./use-home-scene";
import CameraRig from "./camera-rig";
import SceneLights from "./scene-lights";
import SceneReadyGate from "./scene-ready-gate";
import BuildingMarkers from "@/features/building-markers";
import EnvironmentSetup from "./environment-setup";
import { useIsMobile } from "@/hooks/use-mobile";

// Keep the reflection panorama in the same orientation as the panoramic dome
// baked into the supplied GLB. The dome remains the visible background.
const ENVIRONMENT_ROTATION_DEG = 1;

// Browsers cap the canvas's own default framebuffer MSAA at 4x regardless of
// GPU capability — verified live on this GPU/driver combo: gl.getParameter
// (gl.SAMPLES) reports 4 while gl.getParameter(gl.MAX_SAMPLES) reports 16.
// Routing the scene through an explicit multisampled render target (what
// EffectComposer's `multisampling` prop does — see the postprocessing
// package's EffectComposer.js, `this.inputBuffer.samples`) instead of relying
// on the canvas default lets WebGL actually use more of the GPU's real
// capability. This directly sharpens `alphaToCoverage`'s foliage-edge
// antialiasing (use-home-scene.js's isLeafCutout materials) — the coarser
// 4-sample coverage mask was still visibly stepping/shimmering on leaf-cutout
// silhouettes during orbit even with alphaToCoverage on, independent of the
// mip-level trade-off already handled there. Desktop only: this is an extra
// full-scene render pass every frame, a cost mobile GPUs would pay for
// disproportionately, so mobile keeps the existing 4x default untouched.
const DESKTOP_MSAA_SAMPLES = 8;

const HomeSceneImpl = ({ controlsRef, onReady, onHintVisibleChange }) => {
  const { scene } = useHomeScene();
  const isMobile = useIsMobile();
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

      <CameraRig
        controlsRef={controlsRef}
        onHintVisibleChange={onHintVisibleChange}
      />

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

      {/* Desktop-only: routes the scene through an explicit N-sample
          multisampled render target instead of the canvas's browser-capped
          4x default — see DESKTOP_MSAA_SAMPLES above. No <Effect> children:
          EffectComposer always adds its own RenderPass regardless of
          children, so this composer's only job is the higher-sample resolve,
          not any visual effect. Deliberately NOT paired with SMAA (unlike
          features/scene-environment's usage of this same component) — that
          file's own comment notes combining hardware multisampling with SMAA
          causes WebGL buffer conflicts; this composer's multisampling IS the
          antialiasing here. */}
      {!isMobile && (
        <EffectComposer
          multisampling={DESKTOP_MSAA_SAMPLES}
          stencilBuffer={false}
        />
      )}
    </Fragment>
  );
};

// Memoized: controlsRef/onReady/onHintVisibleChange are all stable
// references from useHome (useRef + useCallback([])), so this — and by
// extension CameraRig, BuildingMarkers, EnvironmentSetup, everything in this
// subtree — bails out of re-rendering when HomeContainer re-renders for a
// reason that has nothing to do with this scene (isReady/showAutoRotateHint
// toggling being the main one: without this, every hint show/hide re-ran
// every component's render function in the entire 3D scene for no visual
// reason, since none of them actually read that state).
export const HomeScene = memo(HomeSceneImpl);

export default HomeScene;
