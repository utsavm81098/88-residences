import { Suspense, useRef, useEffect } from "react";
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

const HDR_URL = "/hdr/san_bridge_2k.hdr";
useEnvironment.preload(HDR_URL);

function ResponsiveCamera() {
  const config = useResponsiveConfig();
  return (
    <PerspectiveCamera
      makeDefault
      fov={35}
      near={0.5}
      far={2000}
      position={[0, 10, config.cameraZ]}
    />
  );
}

function App() {
  const controlsRef = useRef();
  const modelRef = useRef();

  const { tooltipState, tooltipElRef, showTooltip, hideTooltip, moveTooltip } =
    useTooltip();

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
        performance={{ min: 0.5, debounce: 200 }}
        frameloop="always"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
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
          {/* Lower environmentIntensity so the HDR's bright sun doesn't blow out the South side, while keeping nice reflections */}
          <Environment
            files={HDR_URL}
            background={false}
            environmentIntensity={0.3}
          />
          {/* Strong ambient light provides a bright, even baseline for all sides */}
          <ambientLight intensity={1.5} />
          {/* Symmetrical 4-point lighting ensures every side is identical */}
          <directionalLight position={[0, 20, -50]} intensity={1.0} />
          {/* North */}
          <directionalLight position={[0, 20, 50]} intensity={0.5} />
          {/* South */}
          <directionalLight position={[50, 20, 0]} intensity={0.5} />
          {/* East */}
          <directionalLight position={[-50, 20, 0]} intensity={1.0} />
          {/* West */}
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
          <EffectComposer multisampling={8}>
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
