import { Suspense, useRef } from "react";
import "./App.css";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  OrbitControls,
  useEnvironment,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";
import DirectionLabels from "./components/direction-labels";

useEnvironment.preload("/hdr/sky.hdr");

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
}

function App() {
  const controlsRef = useRef();
  const modelRef = useRef();

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        performance={{ min: 0.5, debounce: 200 }}
        // ✅ CRITICAL FIX: was "demand" — only re-rendered on pointer events.
        //    "always" renders every frame so HDRI reflections update
        //    continuously as the camera orbits around the scene.
        frameloop="always"
        gl={{
          antialias: true,
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          // ✅ was 0.6 — was darkening the entire HDRI contribution
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
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
          <PerspectiveCamera
            makeDefault
            fov={35}
            near={0.1}
            far={2000}
            position={[50, 15, 50]}
          />

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
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
