import { Fragment, Suspense } from "react";
import "./App.css";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  OrbitControls,
  useEnvironment,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import DirectionalArrows from "./components/directional-arrows";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";

useEnvironment.preload("/hdr/sky.hdr");

function App() {
  return (
    <Fragment>
      <div className="canvas-container">
        <Canvas
          dpr={[1, 1.25]}
          performance={{ min: 0.5, debounce: 200 }}
          frameloop="demand"
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.6,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [80, 40, 120], fov: 45 }}
          shadows={false}
          fallback={<div>Sorry no WebGL supported!</div>}
        >
          {/* <ControlsProvider> */}
          <Suspense
            fallback={<Html style={{ color: "white" }}>Loading Model...</Html>}
          >
            <PerspectiveCamera
              makeDefault
              fov={35}
              near={2}
              far={2000}
              position={[50, 15, 50]}
            />

            <Environment files="/hdr/sky.hdr" background intensity={0.15} />

            <hemisphereLight intensity={0.5} groundColor="#111111" />
            <ambientLight intensity={0.04} />

            <directionalLight position={[60, 100, 40]} intensity={1.2} />

            <GrassGrid />

            <Grid
              position={[0, -0.02, 0]} // ⭐ slightly below model
              args={[300, 300]}
              cellSize={4}
              cellThickness={0}
              sectionSize={20}
              sectionThickness={2}
              sectionColor="#ffffff"
              fadeDistance={200}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
              renderOrder={1}
              material={{
                transparent: true,
                depthWrite: false, // ⭐ prevents z-fighting
                polygonOffset: true,
                polygonOffsetFactor: -10,
                polygonOffsetUnits: -10,
              }}
            />
            <BuildingModel />

            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.05}
              target={[0, 5, 0]} // slightly above ground
              minDistance={50} // prevent too close
              maxDistance={80} // prevent too far
              enablePan={false} // prevents drifting outside
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.1}
            />

            <DirectionalArrows />
          </Suspense>
        </Canvas>
      </div>
    </Fragment>
  );
}

export default App;
