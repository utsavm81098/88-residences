import { useRef } from "react";
import "./app.css";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import TopNavigation from "./containers/top-navigation";
import InventorySidebar from "./containers/inventory-sidebar";
import { useDispatch, useSelector } from "react-redux";
import { resetBuilding } from "./store/slices/building-slice";
import SceneEnvironment from "./features/scene-environment";
import AdaptiveControls from "./features/adaptive-controls";
import DirectionLabel from "./features/direction-label";
import Building from "./features/building";
import BuildingTooltip from "./features/building-tooltip";

import { useIsMobile } from "./hooks/use-mobile";
import { Suspense } from "react";
import { Html } from "@react-three/drei";

function App() {
  const dispatch = useDispatch();
  const { snap } = useSelector((state) => state.building);
  const isMobile = useIsMobile();
  const controlsRef = useRef();
  const modelRef = useRef();

  const handleResetCamera = () => {
    dispatch(resetBuilding());
  };

  const canvasHeight = isMobile
    ? snap.height > 0
      ? `calc(100% - ${snap.height}px)`
      : "60%"
    : "100%";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-white font-outfit">
      {/* Filters Sidebar (Desktop Only) */}
      <InventorySidebar />

      <div
        className="relative flex-1 canvas-container h-full overflow-hidden"
        style={{
          height: canvasHeight,
          transition: "height 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <TopNavigation onReset={handleResetCamera} />
        <Canvas
          dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
          performance={{ min: 0.5, debounce: 200 }}
          frameloop="always"
          gl={{
            antialias: true,
            toneMapping: THREE.LinearToneMapping,
            toneMappingExposure: 1.0,
            powerPreference: "high-performance",
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          shadows
        >
          <Suspense
            fallback={
              <Html
                center
                style={{
                  color: "white",
                }}
              >
                Loading Model...
              </Html>
            }
          >
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
        <BuildingTooltip />
      </div>
    </div>
  );
}

export default App;
