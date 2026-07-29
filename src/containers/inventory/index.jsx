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
import { CanvasLoader } from "@/containers/canvas-loader";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { CANVAS_GL_CONFIG } from "@/utils/constant";
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
export default function InventoryContainer() {
  const {
    controlsRef,
    modelRef,
    canvasHeight,
    handleResetCamera,
    handleResetCache,
  } = useInventory();

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
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
          <ComponentErrorBoundary name="3D Canvas" onReset={handleResetCache}>
            <Canvas
              dpr={[1, Math.min(window.devicePixelRatio, 2)]}
              performance={{ min: 0.5, debounce: 200 }}
              gl={CANVAS_GL_CONFIG}
            >
              <WebGLRecoveryGuard onFatalLoss={handleResetCache} />
              <Suspense fallback={<CanvasLoader />}>
                <SceneEnvironment>
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
              </Suspense>
            </Canvas>
          </ComponentErrorBoundary>
        </div>
        <BuildingTooltip />
      </div>
    </div>
  );
}
