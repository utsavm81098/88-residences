import { Suspense, useRef } from "react";
import "./App.css";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  useEnvironment,
  Bounds,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
} from "@react-three/drei";

import { Canvas } from "@react-three/fiber";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";
import BuildingTooltip from "./components/building-tooltip";
import useTooltip from "./components/building-tooltip/use-tooltip";

useEnvironment.preload("/hdr/sky.hdr");

function App() {
  const controlsRef = useRef();
  const modelRef = useRef();

  const { tooltipState, tooltipElRef, showTooltip, hideTooltip, moveTooltip } =
    useTooltip();

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
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
        <AdaptiveDpr pixelated />
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
            near={0.1}
            far={2000}
            position={[80, 15, 80]}
          />

          <Environment
            files="/hdr/venice_sunset_1k.hdr"
            background={false}
            resolution={1024}
            environmentIntensity={1.5}
          />

          <ambientLight intensity={0.15} color="#ffffff" />

          {/* Key light — front */}
          <directionalLight
            position={[5, 12, 8]}
            intensity={0.6}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-camera-left={-80}
            shadow-camera-right={80}
            shadow-camera-top={80}
            shadow-camera-bottom={-80}
            shadow-bias={-0.0005}
          />

          <directionalLight
            position={[-5, 8, -8]}
            intensity={0.3}
            color="#ddeeff"
          />

          {/* ✅ FIX 4: Remove hemisphereLight — not in the viewer, causes color tint */}

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.5}
            scale={50}
            blur={2}
            far={10}
          />
          {/* Ambient matches viewer's ambientIntensity=0.3 */}
          <ambientLight intensity={0.3} color="#ffffff" />
          <GrassGrid position={[0, 0, 0]} renderOrder={2} />
          <Grid
            position={[0, 0.01, 0]} // ⭐ between grass (-0.15) and model (0)
            args={[300, 300]}
            cellSize={2}
            cellThickness={0}
            sectionSize={10}
            sectionThickness={1}
            sectionColor="#ffffff"
            fadeDistance={200}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
            depthWrite={false}
            depthTest={true}
            renderOrder={1}
            // raycast={() => null}
          />
          {/* <Bounds fit clip observe margin={1.2} maxDuration={0}> */}
          <BuildingModel
            controlsRef={controlsRef}
            modelRef={modelRef}
            position={[0, 0.02, 0]}
            renderOrder={3}
            onTooltipShow={showTooltip}
            onTooltipHide={hideTooltip}
            onTooltipMove={moveTooltip}
          />
          {/* </Bounds> */}
          <AdaptiveControls controlsRef={controlsRef} />
          <DirectionLabel controlsRef={controlsRef} modelRef={modelRef} />
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
