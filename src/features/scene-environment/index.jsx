import { Fragment, Suspense, useEffect } from "react";
import {
  Html,
  Environment,
  PerspectiveCamera,
  Grid,
  useEnvironment,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import useResponsiveConfig from "../../hooks/use-responsive-config";
import { GRID_CONFIG } from "../../utils/config";
import { useSelector } from "react-redux";
import { logger } from "../../utils/logger";
import { BUILDING_CONFIG } from "@/utils/constant";

BUILDING_CONFIG.forEach((config) => {
  if (config.environment) {
    useEnvironment.preload(config.environment);
  }
});

const SceneEnvironment = ({ children }) => {
  const { currentBuilding } = useSelector((state) => state.building);
  const { environment, lighting = {} } = currentBuilding || {};
  const {
    directIntensity = 1.0,
    ambientIntensity = 0.36,
    exposure = 1.0,
  } = lighting;

  const config = useResponsiveConfig();
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  return (
    <Fragment>
      <PerformanceMonitor
        onDecline={() => {
          logger.warn("Performance dropped");
        }}
        onIncline={() => {
          logger.info("Performance improved");
        }}
      />
      <AdaptiveDpr />
      <AdaptiveEvents />
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
        <PerspectiveCamera
          makeDefault
          fov={35}
          near={0.5}
          far={2000}
          position={[0, 10, config.cameraZ]}
        />
        {/* Stationary light replacing the camera headlamp */}
        <directionalLight
          position={[30, 40, 30]} // Front/South-East to match HDR sun lightly
          intensity={directIntensity}
          color="#ffffff"
          castShadow
        />
        {/* Counter-Fill light pointing inward from North-West to kill shadows */}
        {lighting.fillIntensity && (
          <directionalLight
            position={[-30, 40, -30]} // Placed exactly opposite (North-West)
            intensity={lighting.fillIntensity}
            color="#ffffff"
            castShadow={false} // Soft fill light only
          />
        )}
        <Environment {...environment} />
        <ambientLight intensity={ambientIntensity} color="#ffffff" />
        <Grid {...GRID_CONFIG} raycast={() => null} />
        {children}
        <EffectComposer multisampling={8} stencilBuffer={false}>
          <SMAA />
        </EffectComposer>
      </Suspense>
    </Fragment>
  );
};
export default SceneEnvironment;
