import { useRef } from "react";
import "./App.css";
import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import TopNavigation from "./components/ui/top-navigation";
import InventorySidebar from "./components/ui/inventory-sidebar";
import { useDispatch, useSelector } from "react-redux";
import { resetBuilding } from "./redux/reducers/buildingSlice";
import SceneEnvironment from "./features/scene-environment";
import AdaptiveControls from "./features/adaptive-controls";
import DirectionLabel from "./features/direction-label";
import Building from "./features/building";
import BuildingTooltip from "./features/building-tooltip";
import CameraStabilizer from "./features/camera-stabilizer";

function App() {
  const dispatch = useDispatch();
  const controlsRef = useRef();
  const modelRef = useRef();
  const { height, snapIndex } = useSelector((state) => state.building.snap);

  // Check if all preloads and materials are done loading
  const { progress } = useProgress();
  const isLoading = progress < 100;

  const handleResetCamera = () => {
    dispatch(resetBuilding());
  };

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

  // Calculate canvas height: shrink when bottom sheet is at snap 1
  const canvasHeight =
    isMobile && snapIndex === 1
      ? typeof height === "number"
        ? height <= 1
          ? `calc(100% - ${height * 100}%)`
          : `calc(100% - ${height}px)`
        : `calc(100% - ${height})`
      : "100%";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-white">
      {/* Filters Sidebar (Desktop Only) */}
      {!isLoading && <InventorySidebar />}

      <div
        className="relative flex-1 canvas-container h-full overflow-hidden"
        style={{
          height: canvasHeight,
          transition: "height 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        {/* Hide TopNavigation until loading completes completely */}
        {!isLoading && <TopNavigation onReset={handleResetCamera} />}
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
          {isMobile && <CameraStabilizer />}
          <SceneEnvironment>
            <Building
              controlsRef={controlsRef}
              modelRef={modelRef}
              position={[0, 0.02, 0]}
              renderOrder={3}
            />
            <AdaptiveControls controlsRef={controlsRef} />
            <DirectionLabel controlsRef={controlsRef} modelRef={modelRef} />
          </SceneEnvironment>
        </Canvas>
        <BuildingTooltip />
      </div>
    </div>
  );
}

export default App;

