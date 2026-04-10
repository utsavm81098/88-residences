import { Fragment } from "react";
import {
  Environment,
  PerspectiveCamera,
  Grid,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { GRID_CONFIG } from "../../utils/config";
import useSceneEnvironment from "./use-scene-environment";

const SceneEnvironment = ({ children }) => {
  const {
    environment,
    lighting,
    directIntensity,
    ambientIntensity,
    config,
    onPerformanceDecline,
    onPerformanceIncline,
  } = useSceneEnvironment();

  return (
    <Fragment>
      <PerformanceMonitor
        onDecline={onPerformanceDecline}
        onIncline={onPerformanceIncline}
      />
      <AdaptiveDpr />
      <AdaptiveEvents />

      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.5}
        far={2000}
        position={[0, 10, config.cameraZ]}
      />
      {/* Stationary light replacing the camera headlamp */}
      <directionalLight
        position={[30, 40, 30]}
        intensity={directIntensity}
        color="#ffffff"
        castShadow
      />
      {/* Counter-Fill light pointing inward from North-West to kill shadows */}
      {lighting.fillIntensity && (
        <directionalLight
          position={[-30, 40, -30]}
          intensity={lighting.fillIntensity}
          color="#ffffff"
          castShadow={false}
        />
      )}
      <Environment {...environment} />
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <Grid {...GRID_CONFIG} raycast={() => null} />
      {children}
      <EffectComposer multisampling={8} stencilBuffer={false}>
        <SMAA />
      </EffectComposer>
    </Fragment>
  );
};

export default SceneEnvironment;
