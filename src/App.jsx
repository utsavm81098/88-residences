import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./App.css";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
  Bounds,
  PerspectiveCamera,
  Grid,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box3, Vector3 } from "three";
import { baseMaterials, unitData } from "./utils/constant";
import PopUp from "./components/pop-up";
import UnitInfoPopup from "./components/unit-info-popup";
import * as THREE from "three";
import DirectionalArrows from "./components/directional-arrows";
import gsap from "gsap";
import { ControlsProvider, useControls } from "./context/ControlsContext";

const styles = `
.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000000;
}
`;

const CameraController = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const controlsContext = useControls();

  useEffect(() => {
    gl.setClearColor("#000000");
    camera.position.set(0, 15, 70);
    camera.lookAt(controlsRef.current.target);
    const controls = controlsRef.current;
    controls.update();
    if (controlsContext) {
      controlsContext.current = controls;
    }
  }, [camera, controlsContext, gl]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      minDistance={40}
      maxDistance={100}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      enableDamping
      dampingFactor={0.05}
      enableRotate={true}
      screenSpacePanning={true}
      target={[0, 15, 0]}
    />
  );
};

const BuildingModel = ({ onUnitSelect, selectedUnit }) => {
  const { scene } = useGLTF("/models/TYPE-A-HitBox.glb", "/draco/");
  const [selected, setSelected] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const controlsRef = useControls();
  const animationFrameRef = useRef(null);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    const unit = unitData[e.object.name];
    if (unit) {
      const status = unit.status;
      const materials = baseMaterials({ status });

      if (selected && e.object.name === selected.name) {
        e.object.material = materials.selected;
      } else {
        e.object.material = materials.hover;
      }
      document.body.style.cursor = "pointer";
      const newHoverInfo = {
        unit,
        position: { x: e.clientX, y: e.clientY },
      };
      setHoverInfo(newHoverInfo);
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    const unit = unitData[e.object.name];
    if (unit) {
      const status = unit.status;
      const materials = baseMaterials({ status });

      if (selected && e.object.name === selected.name) {
        e.object.material = materials.selected;
      } else {
        e.object.material = materials.color || e.object.material;
      }
      document.body.style.cursor = "auto";
      setHoverInfo(null);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    const clickedObject = e.object;
    const unit = unitData[e.object.name];
    if (unit) {
      onUnitSelect(unit);

      // Update materials for selection
      if (selected && selected !== clickedObject) {
        const prevUnit = unitData[selected.name];
        if (prevUnit) {
          const prevMaterials = baseMaterials({ status: prevUnit.status });
          selected.material = prevMaterials.color;
        }
      }

      const status = unit.status;
      const materials = baseMaterials({ status });
      clickedObject.material = materials.selected;
      setSelected(clickedObject);

      console.log("controlsRef: ", controlsRef);
      if (controlsRef && controlsRef.current) {
        gsap.killTweensOf(controlsRef.current.target);
        gsap.killTweensOf(controlsRef.current.object.position);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        controlsRef.current.enabled = true;

        const worldPosition = new Vector3();
        clickedObject.getWorldPosition(worldPosition);

        const startPosition = controlsRef.current.object.position.clone();
        const startTarget = controlsRef.current.target.clone();

        const buildingCenter = new Vector3(0, 0, 0);

        const flatStartPosition = new Vector3(
          startPosition.x,
          0,
          startPosition.z
        );
        const flatWorldPosition = new Vector3(
          worldPosition.x,
          0,
          worldPosition.z
        );

        const initialDistanceToCenter =
          flatStartPosition.distanceTo(buildingCenter);

        const endTarget = new Vector3(
          worldPosition.x,
          controlsRef.current.target.y,
          worldPosition.z
        );

        const objectToCenterDir = new Vector3(
          worldPosition.x - buildingCenter.x,
          0, // Ignore Y component
          worldPosition.z - buildingCenter.z
        ).normalize();

        const objectDistanceFromCenter =
          flatWorldPosition.distanceTo(buildingCenter);

        const endPosition = new Vector3(
          worldPosition.x +
            objectToCenterDir.x *
              (initialDistanceToCenter - objectDistanceFromCenter),
          startPosition.y,
          worldPosition.z +
            objectToCenterDir.z *
              (initialDistanceToCenter - objectDistanceFromCenter)
        );

        const originalSettings = {
          enabled: controlsRef.current.enabled,
          minDistance: controlsRef.current.minDistance,
          maxDistance: controlsRef.current.maxDistance,
        };

        controlsRef.current.enabled = false;

        const animationProxy = {
          targetX: startTarget.x,
          targetY: startTarget.y,
          targetZ: startTarget.z,
          positionX: startPosition.x,
          positionY: startPosition.y,
          positionZ: startPosition.z,
          progress: 0,
        };

        gsap.to(animationProxy, {
          targetX: endTarget.x,
          targetY: endTarget.y,
          targetZ: endTarget.z,
          positionX: endPosition.x,
          positionY: endPosition.y,
          positionZ: endPosition.z,
          progress: 1,
          duration: 1.2,
          ease: "power3.out",
          onUpdate: () => {
            if (!controlsRef.current) return;

            controlsRef.current.target.set(
              animationProxy.targetX,
              animationProxy.targetY,
              animationProxy.targetZ
            );

            controlsRef.current.object.position.set(
              animationProxy.positionX,
              animationProxy.positionY,
              animationProxy.positionZ
            );

            controlsRef.current.object.lookAt(controlsRef.current.target);
            controlsRef.current.object.updateMatrixWorld(true);

            controlsRef.current.update();
          },
          onComplete: () => {
            if (!controlsRef.current) return;

            controlsRef.current.enabled = originalSettings.enabled;
            controlsRef.current.minDistance = originalSettings.minDistance;
            controlsRef.current.maxDistance = originalSettings.maxDistance;

            controlsRef.current.update();
          },
        });
      }
    }
  };
  console.log("controlsRef:>>23232 ", controlsRef);

  useEffect(() => {
    const box = new Box3().setFromObject(scene);
    const center = box.getCenter(new Vector3());
    scene.position.sub(center);
    scene.position.y = box.min.y * -1.1;

    scene.traverse((object) => {
      if (object.type === "Mesh") {
        const unitName = object.name;
        const unit = unitData[unitName];

        if (unit) {
          const status = unit.status;
          const materials = baseMaterials({ status });

          object.material = materials.color || object.material;
          object.userData = { status: unit.status };
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    const controls = controlsRef?.current;
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        if (controls) controls.enabled = true;
      }
    };
  }, [controlsRef]);

  useEffect(() => {
    if (!selectedUnit && selected) {
      const prevUnit = unitData[selected.name];
      if (prevUnit) {
        const prevMaterials = baseMaterials({ status: prevUnit.status });
        selected.material = prevMaterials.color;
      }
      setSelected(null);
    }
  }, [selectedUnit, selected]);

  return (
    <>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {hoverInfo && (
        <Html>
          <div style={{ display: "none" }}>
            <PopUp unit={hoverInfo.unit} position={hoverInfo.position} />
          </div>
        </Html>
      )}
    </>
  );
};

BuildingModel.propTypes = {
  onUnitSelect: PropTypes.func.isRequired,
  selectedUnit: PropTypes.object,
};

const GrassPlane = () => {
  const grassTexture = useTexture("/textures/grass.jpg");

  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(20, 20);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[300, 300, 128, 128]} />
      <meshStandardMaterial
        map={grassTexture}
        roughness={0.8}
        metalness={0.1}
        depthWrite={true}
        polygonOffset={true}
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
};

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
      <style>{styles}</style>
      <div className="canvas-container">
        <Canvas
          shadows
          dpr={[1, 2]}
          fallback={<div>Sorry no WebGL supported!</div>}
        >
          <ControlsProvider>
            <Suspense
              fallback={
                <Html style={{ color: "white" }}>Loading Model...</Html>
              }
            >
              <PerspectiveCamera
                makeDefault
                fov={35}
                near={1}
                far={1000}
                position={[30, 15, 70]}
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
              <GrassPlane />
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
              <Environment preset="night" />
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
