import { Suspense, useMemo, memo } from "react";
import { Canvas } from "@react-three/fiber";
import useSceneCanvas, {
  VEIL_PEAK_OPACITY,
  VEIL_FADE_IN_MS,
  VEIL_FADE_OUT_MS,
} from "./use-scene-canvas";
import HomeScene from "@/features/home-scene";
import SceneEnvironment from "@/features/scene-environment";
import Building from "@/features/building";
import AdaptiveControls from "@/features/adaptive-controls";
import DirectionLabel from "@/features/direction-label";
import SceneReadyGate from "@/features/scene-ready-gate";
import KTX2Init from "@/features/ktx2-init";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import SceneLoadingIndicator from "@/components/ui/scene-loading-indicator";
import { solveFraming } from "@/features/home-scene/fit-camera";
import { HOME_CAMERA } from "@/utils/constant";
import useWebGLRecovery from "@/hooks/use-webgl-recovery";
import { logger } from "@/utils/logger";

/**
 * Safety net inside the single Canvas: intercepts WebGL context loss to prevent a tab crash.
 */
function WebGLRecoveryGuard({ onFatalLoss }) {
  useWebGLRecovery({
    onContextLost: onFatalLoss,
    onContextRestored: () => {
      logger.info("WebGL context restored — scene will re-initialize");
    },
  });
  return null;
}

/**
 * SceneCanvasContainer - Unified Single Canvas hosting both Home and Inventory 3D scenes.
 */
export const SceneCanvasContainer = memo(() => {
  const {
    isHome,
    isInventory,
    isVeiled,
    glConfig,
    dpr,
    homeControlsRef,
    handleHomeReady,
    inventoryControlsRef,
    inventoryModelRef,
    handleInventoryReady,
    handleResetAllCaches,
    showBuildingLoadingIndicator,
  } = useSceneCanvas();

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
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="flex h-full w-full items-center justify-center"
        dir="ltr"
        // Single, permanent owner of this concern for the ONE shared canvas
        // element both scenes render into. touch-action's "used value" for a
        // descendant is the INTERSECTION of every ancestor's value, so
        // setting "none" here holds regardless of what any per-scene
        // component's own effect does to the <canvas> element's own inline
        // style below it.
        //
        // Previously this was set imperatively on gl.domElement inside
        // features/home-scene/camera-rig.jsx — which only *mounts* while
        // Home is active (`{active && <CameraRig .../>}` in
        // features/home-scene/index.jsx) — so its cleanup ran and reset
        // touch-action to "" the moment Inventory became active, and nothing
        // on the Inventory side ever set it back. Confirmed match for the
        // reported bug: on mobile, in Inventory only, the page would scroll
        // under a one-finger drag and pinch-zoom would fight the browser's
        // own native viewport zoom instead of OrbitControls' JS-driven dolly
        // — because with the ancestor value gone, the canvas's effective
        // touch-action fell back to "auto" the instant CameraRig unmounted.
        style={{ touchAction: "none" }}
      >
        <ComponentErrorBoundary
          name="Unified 3D Canvas"
          onReset={handleResetAllCaches}
        >
          <Canvas
            dpr={dpr}
            gl={glConfig}
            camera={initialCamera}
            frameloop="always"
          >
            <KTX2Init />
            <WebGLRecoveryGuard onFatalLoss={handleResetAllCaches} />
            <Suspense fallback={null}>
              {/* ── HOME 3D MASTERPLAN SCENE ── */}
              <group visible={isHome} name="HomeSceneRoot">
                <HomeScene
                  controlsRef={homeControlsRef}
                  onReady={handleHomeReady}
                  active={isHome}
                />
              </group>

              {/* ── INVENTORY 3D BUILDING SCENE ── */}
              <group visible={isInventory} name="InventorySceneRoot">
                <SceneEnvironment active={isInventory}>
                  <Building
                    controlsRef={inventoryControlsRef}
                    modelRef={inventoryModelRef}
                    position={[0, 0.02, 0]}
                    active={isInventory}
                  />
                  <AdaptiveControls
                    controlsRef={inventoryControlsRef}
                    active={isInventory}
                  />
                  <DirectionLabel controlsRef={inventoryControlsRef} />
                </SceneEnvironment>
                {isInventory && (
                  <SceneReadyGate onReady={handleInventoryReady} />
                )}
              </group>
            </Suspense>
          </Canvas>
        </ComponentErrorBoundary>

        {/* Soft dim veil masking the Home <-> Inventory cut. isHome/
            isInventory above already lag one beat behind the real route
            change (see use-scene-canvas.js's displayedKey) specifically so
            the camera/lighting reset they trigger always happens while this
            is at its peak dim.
            Peak opacity is capped at VEIL_PEAK_OPACITY (never 1/fully
            solid) — a fully opaque cover reads as "the screen went black"
            on this dark theme (reported and confirmed), not a transition.
            Capped, the outgoing scene stays faintly visible right through
            the dip instead of being hidden behind a solid card, which is
            what actually reads as a smooth fade rather than a flash. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 bg-background"
          style={{
            opacity: isVeiled ? VEIL_PEAK_OPACITY : 0,
            transitionProperty: "opacity",
            transitionDuration: `${isVeiled ? VEIL_FADE_IN_MS : VEIL_FADE_OUT_MS}ms`,
            transitionTimingFunction: "ease-in-out",
          }}
        />

        <SceneLoadingIndicator visible={showBuildingLoadingIndicator} />
      </div>
    </div>
  );
});

export default SceneCanvasContainer;
