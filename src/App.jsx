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
} from "@react-three/drei";

import { Canvas, useFrame } from "@react-three/fiber";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";

useEnvironment.preload("/hdr/sky.hdr");

function App() {
  const controlsRef = useRef();
  const modelRef = useRef();

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        performance={{ min: 0.5, debounce: 200 }}
        frameloop="always"
        gl={{
          antialias: true,
          toneMapping: THREE.LinearToneMapping,
          toneMappingExposure: 1,
          powerPreference: "high-performance",
          outputColorSpace: THREE.SRGBColorSpace,
          physicallyCorrectLights: true,
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
          <PerspectiveCamera makeDefault fov={35} near={0.1} far={2000} />
          <Environment
            files="/hdr/kloppenheim_06_puresky_4k.hdr"
            background={false}
            intensity={1}
            resolution={256}
          />
          <ambientLight intensity={0.3} color="#ffffff" />
          <directionalLight
            intensity={2.5}
            color="#ffffff"
            position={[5, 10, 5]}
            castShadow
          />
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
            raycast={() => null}
          />
          <Bounds fit clip observe margin={1.2}>
            <BuildingModel
              controlsRef={controlsRef}
              modelRef={modelRef}
              position={[0, 0.02, 0]}
              renderOrder={3}
            />
          </Bounds>
          <AdaptiveControls controlsRef={controlsRef} />
          <DirectionLabel controlsRef={controlsRef} modelRef={modelRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
