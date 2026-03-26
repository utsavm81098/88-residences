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
} from "@react-three/drei";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";
import BuildingTooltip from "./components/building-tooltip";
import useTooltip from "./components/building-tooltip/use-tooltip";

const HDR_URL = "/hdr/san_bridge_2k.hdr";
useEnvironment.preload(HDR_URL);

// ✅ Just this
const CAMERA_POSITION = [0, 10, 60];

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
        {/* <ControlsProvider> */}
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
          <PerspectiveCamera
            makeDefault
            fov={35}
            near={0.5}
            far={2000}
            position={CAMERA_POSITION}
          />
          <Environment files={HDR_URL} background={false} />

          {/* Main light (South-East) */}
          <directionalLight position={[10, 10, -10]} intensity={1.5} />

          {/* Opposite fill light (North-West) */}
          <directionalLight position={[-10, 10, 10]} intensity={1} />

          {/* Soft ambient to balance everything */}
          <ambientLight intensity={0.3} />

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
