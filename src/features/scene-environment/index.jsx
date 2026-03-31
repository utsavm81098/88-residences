import { Fragment, Suspense } from "react";
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
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import useResponsiveConfig from "../../hooks/useResponsiveConfig";
import { GRID_CONFIG } from "../../utils/config";
import { useSelector } from "react-redux";
import { BUILDING_CONFIG } from "../../utils/constant";

BUILDING_CONFIG.forEach((config) => {
  if (config.environment) {
    useEnvironment.preload(config.environment);
  }
});

const SceneEnvironment = ({ children }) => {
  const { currentBuilding } = useSelector((state) => state.building);
  const { environment } = currentBuilding || {};
  const config = useResponsiveConfig();
  return (
    <Fragment>
      <PerformanceMonitor
        onDecline={() => {
          console.log("Performance dropped");
        }}
        onIncline={() => {
          console.log("Performance improved");
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
        >
          <directionalLight
            position={[-30, 40, 20]}
            intensity={1.0}
            color="#ffffff"
            castShadow
          />
        </PerspectiveCamera>
        <Environment {...environment} />
        <ambientLight intensity={0.36} color="#ffffff" />
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
