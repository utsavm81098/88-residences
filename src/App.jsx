import { Suspense, useRef } from "react";
import "./App.css";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  useEnvironment,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  useProgress,
} from "@react-three/drei";

import { Canvas, useThree } from "@react-three/fiber";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";
import BuildingTooltip from "./components/building-tooltip";
import useTooltip from "./components/building-tooltip/use-tooltip";
import useResponsiveConfig from "./hooks/useResponsiveConfig";
import TopNavigation from "./components/ui/top-navigation";
import { useDispatch, useSelector } from "react-redux";
import { BUILDING_CONFIG } from "./utils/constant";
import { resetBuilding } from "./redux/reducers/buildingSlice";

// Preload all dynamic building environments to ensure seamless transitions
BUILDING_CONFIG.forEach((config) => {
  if (config.environment) {
    useEnvironment.preload(config.environment);
  }
});

function ResponsiveCamera() {
  const config = useResponsiveConfig();
  return (
    <PerspectiveCamera
      makeDefault
      fov={35}
      near={0.5}
      far={2000}
      position={[0, 10, config.cameraZ]}
    >
      {/* Light strictly attached to the camera. Positioned to cast deep, realistic shadows towards the bottom-right, perfectly identical to your glTF Viewer screenshot. */}
      {/* Scaled down to 1.0 to perfectly match the glTF Viewer's high-contrast but exposure-lowered ratio */}
      <directionalLight
        position={[-30, 40, 20]}
        intensity={1.0}
        color="#ffffff"
        castShadow
      />
    </PerspectiveCamera>
  );
}

function App() {
  const dispatch = useDispatch();
  const { currentBuilding } = useSelector((state) => state.building);
  const controlsRef = useRef();
  const modelRef = useRef();

  const { tooltipState, tooltipElRef, showTooltip, hideTooltip, moveTooltip } =
    useTooltip();

  // Check if all preloads and materials are done loading
  const { progress } = useProgress();
  const isLoading = progress < 100;

  const handleResetCamera = () => {
    dispatch(resetBuilding());
  };

  return (
    <div className="canvas-container">
      {/* Hide TopNavigation until loading completes completely */}
      {!isLoading && <TopNavigation onReset={handleResetCamera} />}
      <Canvas
        dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
        performance={{ min: 0.5, debounce: 200 }}
        frameloop="always"
        gl={{
          antialias: true,
          toneMapping: THREE.LinearToneMapping, // Essential for preventing the "blown out" white clipping
          toneMappingExposure: 1.0,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows
        fallback={<div>Sorry no WebGL supported!</div>}
        style={{ width: "100%", height: "100%" }}
      >
        <PerformanceMonitor
          onDecline={() => {
            console.log("Performance dropped");
          }}
          onIncline={() => {
            console.log("Performance improved");
          }}
        />
        <AdaptiveDpr />
        <AdaptiveEvents />
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
          <ResponsiveCamera />
          {/* Use the specific environment HDR if defined for the building, otherwise fall back to the "city" preset */}
          {currentBuilding?.environment ? (
            <Environment files={currentBuilding.environment} background={false} />
          ) : (
            <Environment preset="city" background={false} />
          )}
          {/* Extremely low ambient perfectly translates the deep dark shadows from your print screen */}
          <ambientLight intensity={0.36} color="#ffffff" />
          <Grid
            position={[0, 0.01, 0]}
            args={[300, 300]}
            cellSize={2}
            cellThickness={0}
            sectionSize={10}
            sectionThickness={0.9}
            sectionColor="#ffffff"
            fadeDistance={200}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
            renderOrder={1}
            raycast={() => null}
          />
          <BuildingModel
            controlsRef={controlsRef}
            modelRef={modelRef}
            position={[0, 0.02, 0]}
            renderOrder={3}
            onTooltipShow={showTooltip}
            onTooltipHide={hideTooltip}
            onTooltipMove={moveTooltip}
          />
          <AdaptiveControls controlsRef={controlsRef} />
          <DirectionLabel controlsRef={controlsRef} modelRef={modelRef} />
          <EffectComposer multisampling={8} stencilBuffer={false}>
            <SMAA />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <BuildingTooltip
        tooltipState={tooltipState}
        tooltipElRef={tooltipElRef}
      />
    </div>
  );
}

export default App;
