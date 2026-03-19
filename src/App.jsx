import { Suspense, useRef } from "react";
import "./App.css";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  useEnvironment,
  Bounds,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";

useEnvironment.preload("/hdr/sky.hdr");

// function Headlamp() {
//   const lightRef = useRef();

//   useFrame((state) => {
//     if (lightRef.current) {
//       // Copy the camera's world position to the light
//       lightRef.current.position.copy(state.camera.position);
//     }
//   });

//   return (
//     <directionalLight
//       ref={lightRef}
//       castShadow={false} // No shadows, as requested
//     />
//   );
// }

function RotatingEnvironment({ modelRef }) {
  const envRef = useRef();

  useFrame(() => {
    if (envRef.current && modelRef.current) {
      // Sync environment with model rotation
      envRef.current.rotation.y = modelRef.current.rotation.y;
    }
  });

  return (
    <group ref={envRef}>
      <Environment files="/hdr/sky.hdr" background={false} />
    </group>
  );
}

function Headlamp() {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.copy(state.camera.position);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={2}
      distance={0} // infinite range
      decay={2}
    />
  );
}

function App() {
  const controlsRef = useRef();
  const modelRef = useRef();
  const hdriRotation = Math.PI / 4; // example

  const sunDirection = new THREE.Vector3(
    Math.sin(hdriRotation),
    1,
    Math.cos(hdriRotation),
  ).normalize();

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        performance={{ min: 0.5, debounce: 200 }}
        frameloop="always"
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          physicallyCorrectLights: true,
        }}
        shadows={false}
        fallback={<div>Sorry no WebGL supported!</div>}
        style={{ width: "100%", height: "100%" }}
      >
        {/* <ControlsProvider> */}
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
          <mesh position={sunDirection.clone().multiplyScalar(10)}>
            <sphereGeometry args={[1]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          <PerspectiveCamera
            makeDefault
            fov={35}
            near={0.1}
            far={2000}
            position={[50, 15, 50]}
          />

          <Environment files="/hdr/sky.hdr" background={false} intensity={1} />

          <directionalLight position={[10, 20, 10]} intensity={1.2} />

          <hemisphereLight
            intensity={0.6}
            skyColor="#ffffff"
            groundColor="#444444"
          />
          {/* <directionalLight
            position={sunDirection.clone().multiplyScalar(10)}
            castShadow={false} // No shadows, as requested
          /> */}

          {/* <Environment files="/hdr/sky.hdr" background={false} intensity={2} /> */}
          {/* 
          <ambientLight intensity={0.6} />

          <Headlamp /> */}
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
