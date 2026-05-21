import { useRef } from "react";
import "@/app.css";
import { Canvas } from "@react-three/fiber";
import TopNavigation from "@/containers/top-navigation";
import { useDispatch, useSelector } from "react-redux";
import { resetBuilding } from "@/store/slices/building-slice";
import SceneEnvironment from "@/features/scene-environment";
import AdaptiveControls from "@/features/adaptive-controls";
import DirectionLabel from "@/features/direction-label";
import Building from "@/features/building";
import BuildingTooltip from "@/features/building-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

import { Suspense } from "react";
import { CanvasLoader } from "@/containers/canvas-loader";
import { CANVAS_GL_CONFIG } from "@/utils/constant";
import SidebarPanel from "@/containers/sidebar-panel";

const Inventory = () => {
  const dispatch = useDispatch();
  const { snapHeight } = useSelector((state) => state.building);
  const isMobile = useIsMobile();
  const controlsRef = useRef();
  const modelRef = useRef();

  const handleResetCamera = () => {
    dispatch(resetBuilding());
  };

  const canvasHeight = isMobile ? `calc(100% - ${snapHeight + 70}px)` : "100%";

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Active Content Panel (Takes 340px) - Co-exists with the global sidebar in the layout */}
      <div className="hidden lg:block w-[340px] h-full border-e border-white/5 shrink-0">
        <SidebarPanel />
      </div>

      <div
        className="relative flex-1 canvas-container h-full overflow-hidden"
        style={{
          height: canvasHeight,
          transition: "height 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <TopNavigation onReset={handleResetCamera} />
        <div className="w-full h-full" dir="ltr">
          <Canvas
            dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
            performance={{ min: 0.5, debounce: 200 }}
            frameloop="always"
            gl={CANVAS_GL_CONFIG}
            shadows
          >
            {/* {import.meta.env.DEV && <Stats />} */}
            <Suspense fallback={<CanvasLoader />}>
              <SceneEnvironment>
                <Building
                  controlsRef={controlsRef}
                  modelRef={modelRef}
                  position={[0, 0.02, 0]}
                />
                <AdaptiveControls controlsRef={controlsRef} />
                <DirectionLabel controlsRef={controlsRef} />
              </SceneEnvironment>
            </Suspense>
          </Canvas>
        </div>
        <BuildingTooltip />
      </div>
    </div>
  );
};

export default Inventory;
