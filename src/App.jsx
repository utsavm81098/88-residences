import {
  createContext,
  Fragment,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

const styles = `
.canvas-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000000;
}
`;

const ControlsContext = createContext(null);
const ControlsProvider = ({ children }) => {
  const controlsRef = useRef(null);

  return (
    <ControlsContext.Provider value={controlsRef}>
      {children}
    </ControlsContext.Provider>
  );
};
ControlsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

const CameraController = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const controlsContext = useContext(ControlsContext);

  useEffect(() => {
    gl.setClearColor("#000000");
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
      // minPolarAngle={Math.PI / 10}
      maxPolarAngle={Math.PI / 2.5}
      enableDamping
    />
  );
};

const BuildingModel = ({ onUnitSelect, selectedUnit }) => {
  const { scene } = useGLTF("/models/TYPE-A-HitBox.glb", "/draco/");
  const [selected, setSelected] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const controlsRef = useContext(ControlsContext);
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

      if (controlsRef && controlsRef.current) {
        // Cancel any ongoing animation first
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          controlsRef.current.enabled = true;
        }

        const worldPosition = new Vector3();
        e.object.getWorldPosition(worldPosition);

        // Save current camera position and target
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

        // Calculate distance on the XZ plane only
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
          startPosition.y, // Keep original camera height
          worldPosition.z +
            objectToCenterDir.z *
              (initialDistanceToCenter - objectDistanceFromCenter)
        );

        // Animation
        const startTime = Date.now();
        const duration = 1200;

        // Store original values from controls
        const originalEnabled = controlsRef.current.enabled;
        const originalMinDistance = controlsRef.current.minDistance;
        const originalMaxDistance = controlsRef.current.maxDistance;

        // Disable controls during animation
        controlsRef.current.enabled = false;

        const animate = () => {
          const now = Date.now();
          const progress = Math.min((now - startTime) / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

          // Interpolate target
          const newTarget = new Vector3().lerpVectors(
            startTarget,
            endTarget,
            easeProgress
          );

          // Interpolate camera position
          const newPosition = new Vector3().lerpVectors(
            startPosition,
            endPosition,
            easeProgress
          );

          // Apply the new positions directly to the camera and controls
          controlsRef.current.target.copy(newTarget);
          controlsRef.current.object.position.copy(newPosition);

          // Force the camera to look at the target
          controlsRef.current.object.lookAt(newTarget);
          controlsRef.current.object.updateMatrixWorld(true);

          // Refresh controls
          controlsRef.current.update();

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            // Animation complete - restore control settings
            controlsRef.current.enabled = originalEnabled;
            controlsRef.current.minDistance = originalMinDistance;
            controlsRef.current.maxDistance = originalMaxDistance;
            animationFrameRef.current = null;
          }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  };

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
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial
        map={grassTexture}
        normalScale={new THREE.Vector2(0.8, 0.8)}
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
                position={[30, 25, 50]}
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
                position={[0, 0.05, 0]}
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
