import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useSelector } from "react-redux";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { logger } from "@/utils/logger";
import { useEnvironment } from "@react-three/drei";
import { BUILDING_CONFIG, Preset } from "@/utils/constant";

// Preload environments
BUILDING_CONFIG.forEach((config) => {
  if (config.environment) {
    useEnvironment.preload(config.environment);
  }
});

export const useSceneEnvironment = () => {
  const { currentBuilding } = useSelector((state) => state.building);
  const { environment, lighting = {} } = currentBuilding || {};
  const {
    directIntensity = 1.0,
    directColor = "#ffffff",
    ambientIntensity = 0.36,
    ambientColor = "#ffffff",
    exposure = 1.0,
    preset = null,
  } = lighting;

  const config = useResponsiveConfig();
  const { gl } = useThree();

  // useEffect(() => {
  //   gl.toneMappingExposure = exposure;
  // }, [gl, exposure]);

  const onPerformanceDecline = () => {
    logger.warn("Performance dropped");
  };

  const onPerformanceIncline = () => {
    logger.info("Performance improved");
  };

  return {
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
  };
};

export default useSceneEnvironment;
