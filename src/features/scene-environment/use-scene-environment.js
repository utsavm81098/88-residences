import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useThree } from "@react-three/fiber";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { logger } from "@/utils/logger";

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

  const { size } = useThree();
  const config = useResponsiveConfig();

  // Calculate dynamic FOV to keep horizontal framing consistent when aspect ratio shrinks.
  // Uses a fixed reference aspect (1.2 = typical desktop landscape) so the camera never
  // jumps when the window crosses a responsive breakpoint during resize.
  const fov = useMemo(() => {
    const baseFov = 35;
    const baseAspect = 1.2;
    const aspect = size.width / size.height;

    if (aspect < baseAspect) {
      const baseFovRad = (baseFov * Math.PI) / 180;
      const calculatedFov =
        2 *
        Math.atan(Math.tan(baseFovRad / 2) * (baseAspect / aspect)) *
        (180 / Math.PI);

      // Clamp max FOV to 60 degrees to prevent perspective fish-eye distortion
      return Math.min(60, Math.round(calculatedFov));
    }

    return baseFov;
  }, [size.width, size.height]);

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
    fov,
    onPerformanceDecline,
    onPerformanceIncline,
  };
};

export default useSceneEnvironment;
