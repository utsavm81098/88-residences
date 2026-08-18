import { Suspense, useLayoutEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import useHome from "./use-home";
import HomeLoader from "./home-loader";
import HomeScene from "@/features/home-scene";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { solveFraming } from "@/features/home-scene/fit-camera";
import { HOME_CAMERA, getHomeDpr, getHomeGlConfig } from "@/utils/constant";
import useWebGLRecovery from "@/hooks/use-webgl-recovery";
import { initKTX2 } from "@/utils/preloader";
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
 * KTX2Loader needs a live renderer to know which compressed formats the GPU
 * supports. Rendered outside <Suspense> so it runs before the GLB is requested.
 *
 * useLayoutEffect, not a render-phase call: calling initKTX2 directly in the
 * component body was a side effect during render (harmless in practice since
 * it's idempotent, but against the rules of pure render). useLayoutEffect
 * still fires before any *passive* useEffect in the same commit — including
 * useHomeScene's effect that kicks off the GLB fetch — so KTX2 support
 * detection is still guaranteed to complete before anything tries to
 * transcode a KHR_texture_basisu texture.
 */
function KTX2Init() {
  const gl = useThree((state) => state.gl);
  useLayoutEffect(() => {
    initKTX2(gl);
  }, [gl]);
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
export const HomeContainer = () => {
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
          <Canvas dpr={dpr} gl={glConfig} camera={initialCamera}>
            <KTX2Init />
            <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
            <Suspense fallback={null}>
              <HomeScene controlsRef={controlsRef} onReady={handleReady} />
            </Suspense>
          </Canvas>
        </ComponentErrorBoundary>
      </div>

      <HomeLoader isReady={isReady} />
    </div>
  );
};

export default HomeContainer;
