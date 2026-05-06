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
import useSceneEnvironment from "./use-scene-environment";
import { GRID_CONFIG, Preset } from "@/utils/constant";

const SceneEnvironment = ({ children }) => {
  const {
    environment,
    lighting,
    directIntensity,
    directColor,
    ambientIntensity,
    ambientColor,
    preset,
    config,
    onPerformanceDecline,
    onPerformanceIncline,
  } = useSceneEnvironment();

  const isAssetGenerator = preset === Preset.ASSET_GENERATOR;

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
      >
        {lighting.punctualLights && !isAssetGenerator && (
          <Fragment>
            <ambientLight
              intensity={ambientIntensity}
              color={ambientColor}
              name="ambient_light"
            />
            <directionalLight
              position={[5, -23, 10]}
              intensity={directIntensity}
              color={directColor}
              name="main_light"
            />
          </Fragment>
        )}
      </PerspectiveCamera>

      {isAssetGenerator && <hemisphereLight name="hemi_light" />}

      {!lighting.punctualLights && !isAssetGenerator && (
        <Fragment>
          <ambientLight intensity={ambientIntensity} color={ambientColor} />
          <directionalLight
            position={[30, 40, 30]}
            intensity={directIntensity}
            color={directColor}
            castShadow
          />
        </Fragment>
      )}

      <Environment {...environment} />
      <Grid {...GRID_CONFIG} />
      {children}
      <EffectComposer multisampling={8} stencilBuffer={false}>
        <SMAA />
      </EffectComposer>
    </Fragment>
  );
};

export default SceneEnvironment;
