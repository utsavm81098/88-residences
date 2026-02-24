import { Fragment, Suspense } from "react";
import "./App.css";
import {
  Html,
  Environment,
  // Bounds,
  PerspectiveCamera,
  Grid,
  OrbitControls,
  // Sky,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import DirectionalArrows from "./components/directional-arrows";
import GrassGrid from "./components/grass-grid";
import BuildingModel from "./components/building-model";
import * as THREE from "three";

function App() {
  return (
    <Fragment>
      <div className="canvas-container">
        <Canvas
          // camera={{ position: [12, 8, 14], fov: 50 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ position: [80, 40, 120], fov: 45 }}
          shadows
          fallback={<div>Sorry no WebGL supported!</div>}
        >
          {/* <ControlsProvider> */}
          <Suspense
            fallback={<Html style={{ color: "white" }}>Loading Model...</Html>}
          >
            <PerspectiveCamera
              makeDefault
              fov={45}
              near={0.1}
              far={2000}
              position={[50, 30, 50]}
            />

            {/* <Environment
              files="/hdr/sky.hdr"
              background={false}
              intensity={1}
              // ground={{
              //   height: 20,
              //   radius: 120,
              //   scale: 200,
              // }}
            /> */}
            {/* <color attach="background" args={["#dfe9f3"]} /> */}
            <Environment
              files="/hdr/sky.hdr"
              background
              // blur={0.2} // optional softness
              intensity={1.2}
              resolution={1024}
            />
            <color attach="background" args={["#ffffff"]} />
            <fog attach="fog" args={["#dfe9f3", 200, 1200]} />

            {/* <Sky
              distance={450000}
              sunPosition={[10, 5, 10]}
              inclination={0.49}
              azimuth={0.25}
            /> */}

            {/* <fog attach="fog" args={["#dfe9f3", 200, 800]} /> */}

            <ambientLight intensity={0.3} />
            {/* <directionalLight position={[50, 50, 25]} castShadow /> */}
            {/* <Bounds fit clip observe margin={1.5}> */}
            <BuildingModel />
            {/* </Bounds> */}
            <GrassGrid />

            <Grid
              position={[0, 1, 0]}
              args={[300, 300]}
              cellSize={5}
              cellThickness={0}
              cellColor="#ffffff"
              sectionSize={20}
              sectionThickness={2}
              sectionColor="#ffffff"
              fadeDistance={200}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
            />
            {/* <CameraController /> */}
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
