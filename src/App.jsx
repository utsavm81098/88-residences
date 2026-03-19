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
<<<<<<< HEAD
import { Canvas, useThree } from "@react-three/fiber";
=======
import { Canvas, useFrame } from "@react-three/fiber";
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabel from "./components/direction-label";
import AdaptiveControls from "./components/adaptive-controls";

useEnvironment.preload("/hdr/sky.hdr");

<<<<<<< HEAD
// ✅ This component runs inside the Canvas context and forces
//    every mesh material to use the scene's HDRI environment map.
//    Without this, some materials (especially from GLTF/GLB imports)
//    silently ignore scene.environment.
function SceneEnvironmentApplicator() {
  const { scene } = useThree();

  scene.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      const materials = Array.isArray(obj.material)
        ? obj.material
        : [obj.material];
      materials.forEach((mat) => {
        // Only PBR materials respond to env maps
        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          mat.envMap = scene.environment; // ✅ explicitly bind HDRI
          mat.envMapIntensity = 1.5; // ✅ controls how strongly HDRI reflects
          mat.needsUpdate = true;
        }
      });
    }
  });

  return null;
=======
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
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542
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
<<<<<<< HEAD
        // ✅ CRITICAL FIX: was "demand" — only re-rendered on pointer events.
        //    "always" renders every frame so HDRI reflections update
        //    continuously as the camera orbits around the scene.
=======
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542
        frameloop="always"
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
<<<<<<< HEAD
          // ✅ was 0.6 — was darkening the entire HDRI contribution
          toneMappingExposure: 1.0,
=======
          toneMappingExposure: 1,
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          physicallyCorrectLights: true,
        }}
        shadows={false}
        fallback={<div>Sorry no WebGL supported!</div>}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense
          fallback={
            <Html center style={{ color: "white" }}>
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

<<<<<<< HEAD
          {/*
            ✅ intensity={1} — was 0.15, almost invisible.
            background: renders HDRI as skybox.
            environmentIntensity prop drives scene.environmentIntensity
            which scales IBL (Image Based Lighting) globally.
          */}
          <Environment
            files="/hdr/sky.hdr"
            background
            intensity={1}
            environmentIntensity={1}
          />

          {/*
            ✅ SceneEnvironmentApplicator must be AFTER <Environment>
            so scene.environment is already populated when it runs.
          */}
          <SceneEnvironmentApplicator />

          {/*
            ✅ Removed all manual lights (hemisphere, ambient, directional).
            They were overpowering and flattening the HDRI-based PBR shading.
            The HDRI alone provides full ambient + directional + specular lighting.
          */}
=======
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
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542

          {/* <Environment files="/hdr/sky.hdr" background={false} intensity={2} /> */}
          {/* 
          <ambientLight intensity={0.6} />

          <Headlamp /> */}
          <GrassGrid position={[0, 0, 0]} renderOrder={2} />
          <Grid
            position={[0, 0.01, 0]}
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
<<<<<<< HEAD

          <BuildingModel
            controlsRef={controlsRef}
            modelRef={modelRef}
            position={[0, 0.02, 0]}
            renderOrder={3}
          />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            target={[0, 5, 0]}
            enablePan={false}
            enableZoom
            minPolarAngle={1.1}
            maxPolarAngle={1.5}
          />

          <DirectionLabels controlsRef={controlsRef} modelRef={modelRef} />
=======
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
>>>>>>> 2b2f07f92432efc2be8e5b73e40fd6a1cb567542
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
