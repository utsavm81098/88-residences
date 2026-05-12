import { useSelector } from "react-redux";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { logger } from "@/utils/logger";
import { useEnvironment } from "@react-three/drei";
import { BUILDING_CONFIG } from "@/utils/constant";

// Note: Preloading is now handled centrally in src/utils/preloader.js

export const useSceneEnvironment = () => {
  const { currentBuilding } = useSelector((state) => state.building);
  const { environment, lighting = {} } = currentBuilding || {};
  const {
    directIntensity = 1.0,
    directColor = "#ffffff",
    ambientIntensity = 0.36,
    ambientColor = "#ffffff",
    preset = null,
  } = lighting;

  const config = useResponsiveConfig();

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
