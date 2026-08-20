import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import useInventory from "./use-inventory";
import TopNavigation from "@/containers/top-navigation";
import SidebarPanel from "@/containers/sidebar-panel";
import SceneEnvironment from "@/features/scene-environment";
import Building from "@/features/building";
import AdaptiveControls from "@/features/adaptive-controls";
import DirectionLabel from "@/features/direction-label";
import BuildingTooltip from "@/features/building-tooltip";
import KTX2Init from "@/features/ktx2-init";
import SceneReadyGate from "@/features/scene-ready-gate";
import { CanvasLoader } from "@/containers/canvas-loader";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { CANVAS_GL_CONFIG } from "@/utils/constant";
import { cn } from "@/lib/utils";
import useWebGLRecovery from "@/hooks/use-webgl-recovery";
import { logger } from "@/utils/logger";

/**
 * Safety net inside the Canvas: intercepts WebGL context loss to prevent tab crash.
 * Must be a separate component because R3F hooks require Canvas context.
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
 * InventoryContainer - Coordinates the main 3D canvas viewport,
 * controls, tooltips, and side panel layouts.
 */
export default function InventoryContainer({ active = true }) {
  const {
    controlsRef,
    modelRef,
    canvasHeight,
    isReady,
    handleReady,
    handleResetCamera,
    handleResetCache,
  } = useInventory({ active });

  return (
    <>
      {/* `inert` disables focus/pointer-hit-testing on the whole subtree
          regardless of any child's own z-index (TopNavigation's prev/next
          arrows are z-[1000] — see its own comment — which would otherwise
          stay clickable/visible above CanvasLoader's z-[150] overlay). The
          opacity fade makes that real visually too, not just for
          interaction: nothing here is actually visible until the model has
          truly finished loading, matching containers/home/index.jsx's
          HomeLoader treatment. */}
      <div
        inert={!isReady}
        className={cn(
          "flex h-full w-full overflow-hidden bg-background transition-opacity duration-500",
          isReady ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Active Content Panel (Takes 380px) - Co-exists with the global sidebar in the layout */}
        <div className="hidden lg:block w-[380px] h-full border-e border-gray-100 shrink-0">
          <SidebarPanel />
        </div>

        <div
          className="relative flex-1 canvas-container h-full overflow-hidden"
          style={{
            height: canvasHeight,
            transition: "height 0.3s cubic-bezier(0.33, 1, 0.68, 1)",
          }}
        >
          <TopNavigation {...{ onReset: handleResetCamera }} />
          <div
            className="w-full h-full flex justify-center items-center"
            dir="ltr"
          >
            <ComponentErrorBoundary
              name="3D Canvas"
              onReset={handleResetCache}
            >
              <Canvas
                dpr={[1, Math.min(window.devicePixelRatio, 2)]}
                performance={{ min: 0.5, debounce: 200 }}
                gl={CANVAS_GL_CONFIG}
                // See the matching comment in containers/home/index.jsx. This
                // container stays mounted and hidden after its first visit;
                // "never" halts the render loop so the hidden scene — including
                // the EffectComposer/SMAA pass — costs no GPU time.
                //
                // CAUTION for anyone adding post-processing here: R3F's
                // setFrameloop resets clock.elapsedTime to 0 on every toggle, and
                // EffectComposer already feeds `delta` into composer.render().
                // That is safe for SMAA, which is time-independent, and the first
                // delta after resuming is small because clock.start() resets
                // oldTime. A TIME-DEPENDENT pass (Noise, Glitch, ShockWave, any
                // custom shader driving a uTime uniform) would jump on every
                // route switch. Keep every pass in this composer time-independent.
                frameloop={active ? "always" : "never"}
              >
                <KTX2Init />
                <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
                <Suspense fallback={null}>
                  <SceneEnvironment active={active}>
                    <Building
                      {...{
                        controlsRef,
                        modelRef,
                        position: [0, 0.02, 0],
                      }}
                    />
                    <AdaptiveControls {...{ controlsRef }} />
                    <DirectionLabel {...{ controlsRef }} />
                  </SceneEnvironment>
                  {/* Mounted last so the scene graph is complete before
                      warm-up compiles it — see features/scene-ready-gate. */}
                  <SceneReadyGate onReady={handleReady} />
                </Suspense>
              </Canvas>
            </ComponentErrorBoundary>
          </div>
          <BuildingTooltip />
        </div>
      </div>
      <CanvasLoader sceneReady={isReady} />
    </>
  );
}
