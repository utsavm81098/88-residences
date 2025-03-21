import { Fragment, Suspense, useState } from "react";
import "./App.css";
import {
  Html,
  Environment,
  Bounds,
  PerspectiveCamera,
  Grid,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import UnitInfoPopup from "./components/unit-info-popup";
import DirectionalArrows from "./components/directional-arrows";
import { ControlsProvider } from "./context/ControlsContext";
import GrassGrid from "./components/grass-grid";
import CameraController from "./components/camera-controller";
import BuildingModel from "./components/building-model";
import FloorPlan from "./components/floor-plan";

function App() {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [setRotateFunction] = useState(null);

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit);
    setShowInfoPopup(!!unit);
  };

  return (
    <Fragment>
      <div className="canvas-container">
        <Canvas fallback={<div>Sorry no WebGL supported!</div>}>
          <ControlsProvider>
            <Suspense
              fallback={
                <Html style={{ color: "white" }}>Loading Model...</Html>
              }
            >
              <PerspectiveCamera
                makeDefault
                fov={35}
                aspect={1}
                near={1}
                far={1000}
                position={[80, 10, 100]}
              />

              <ambientLight intensity={0.3} />
              <directionalLight position={[10, 10, 5]} castShadow />
              <Bounds fit clip observe margin={1.5}>
                <BuildingModel
                  onUnitSelect={handleUnitSelect}
                  selectedUnit={selectedUnit}
                  onRotate={setRotateFunction}
                />
              </Bounds>
              <GrassGrid />

              <Grid
                position={[0, 0.2, 0]}
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
                infiniteGrid={true}
              />
              <CameraController />
              <axesHelper args={[5]} />
              <Environment preset="night" />
              {/* <FloorPlan /> */}
              <DirectionalArrows />
            </Suspense>
          </ControlsProvider>
        </Canvas>
        {showInfoPopup && (
          <UnitInfoPopup
            unit={selectedUnit}
            onClose={() => {
              setShowInfoPopup(false);
              setSelectedUnit(null);
            }}
          />
        )}
      </div>
    </Fragment>
  );
}

export default App;
