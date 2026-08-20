import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import useHome from "./use-home";
import HomeLoader from "./home-loader";
import HomeScene from "@/features/home-scene";
import KTX2Init from "@/features/ktx2-init";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { solveFraming } from "@/features/home-scene/fit-camera";
import { HOME_CAMERA, getHomeDpr, getHomeGlConfig } from "@/utils/constant";
import useWebGLRecovery from "@/hooks/use-webgl-recovery";
import { logger } from "@/utils/logger";

/**
 * Graceful fallback when WebGL context is lost or fails: renders the full-screen
 * autoplay HeroCarousel loader instead of a crash card.
 */
function HomeCanvasFallback() {
  return <HomeLoader isReady={false} />;
}

/**
 * Safety net inside the Canvas: intercepts WebGL context loss to prevent a tab
 * crash. Must be a separate component because R3F hooks require Canvas context,
 * and must sit outside <Suspense> so it stays mounted while the scene loads.
 */
function WebGLRecoveryGuard({ onFatalLoss }) {
  useWebGLRecovery({
    onContextLost: onFatalLoss,
    onContextRestored: () => {
      logger.info("Home WebGL context restored — scene will re-initialize");
    },
  });
  return null;
}

/**
 * HomeContainer — hosts the 3D masterplan canvas on the home route.
 *
 * All devices load the same optimised GLB; only dpr, MSAA and texture anisotropy
 * are tiered. Framing is solved from the measured canvas aspect (see
 * features/home-scene/fit-camera.js), so there are no per-breakpoint camera
 * numbers to keep in sync.
 */
export const HomeContainer = ({ active = true }) => {
  const {
    controlsRef,
    isMobile,
    canvasHeight,
    isReady,
    handleReady,
    handleResetCache,
  } = useHome();

  const glConfig = useMemo(() => getHomeGlConfig(isMobile), [isMobile]);
  const dpr = useMemo(() => getHomeDpr(isMobile), [isMobile]);

  // Seed the camera on <Canvas> so the correct view is used from the very first
  // frame. Creating it here instead of via drei's <PerspectiveCamera makeDefault>
  // avoids R3F rendering its own default camera first and avoids OrbitControls
  // being rebuilt when state.camera swaps — both of which made the opening frame
  // show a different angle. CameraRig refines fov/position once it measures the
  // canvas; this initial guess just needs to be close.
  const initialCamera = useMemo(() => {
    const aspect =
      typeof window === "undefined"
        ? HOME_CAMERA.baseAspect
        : window.innerWidth / Math.max(window.innerHeight, 1);
    const framing = solveFraming({ camera: HOME_CAMERA, aspect });

    return {
      position: framing.position,
      fov: framing.fov,
      near: HOME_CAMERA.near,
      far: HOME_CAMERA.far,
    };
  }, []);

  return (
    <div
      className="relative h-full w-full flex-1 overflow-hidden bg-background"
      style={{ height: canvasHeight }}
    >
      {/* dir="ltr" keeps orbit drag direction unaffected in Hebrew */}
      <div className="flex h-full w-full items-center justify-center" dir="ltr">
        <ComponentErrorBoundary
          name="Home 3D Canvas"
          FallbackComponent={HomeCanvasFallback}
          onReset={handleResetCache}
        >
          <Canvas
            dpr={dpr}
            gl={glConfig}
            camera={initialCamera}
            // This container stays mounted after its first visit and is hidden
            // by containers/keep-alive-outlet rather than unmounted, so the
            // WebGL context (and every compiled program and uploaded texture)
            // survives navigation. "never" is what stops that mounted-but-
            // invisible scene from costing GPU time: it halts the render loop
            // entirely, so no useFrame callback and no OrbitControls.update()
            // runs while hidden.
            //
            // "demand" instead of "always" while active — was previously
            // "always" (continuous render every frame regardless of whether
            // anything moved), meaning 608 draw calls / up to 300 shader
            // switches every frame even while the user is just looking at a
            // static camera. Verified safe, not just faster: drei's
            // <OrbitControls> (camera-rig.jsx) already calls invalidate() on
            // every 'change' event it dispatches, and controls.update() itself
            // runs inside a useFrame — which only fires on frames R3F actually
            // renders. That's a self-sustaining chain: every rendered frame's
            // update() detects ongoing damping or autoRotate and dispatches
            // 'change' again, requesting the next frame, for as long as
            // something is actually still moving — and stops the instant it
            // settles. No extra invalidate() wiring was needed anywhere in
            // this subtree for that to work.
            //
            // CAUTION: R3F's setFrameloop does clock.stop() and
            // clock.elapsedTime = 0 on every toggle. Nothing in this subtree
            // may read clock.elapsedTime or delta in useFrame — audited at the
            // time of writing (camera-rig ignores its args, building-markers
            // reads camera/size only). Keep it that way.
            frameloop={active ? "demand" : "never"}
          >
            <KTX2Init />
            <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
            <Suspense fallback={null}>
              <HomeScene
                controlsRef={controlsRef}
                onReady={handleReady}
                active={active}
              />
            </Suspense>
          </Canvas>
        </ComponentErrorBoundary>
      </div>

      <HomeLoader isReady={isReady} />
    </div>
  );
};

export default HomeContainer;
