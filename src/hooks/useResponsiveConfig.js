import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

const RESPONSIVE_CONFIG = {
  mobile: {
    cameraZ: 85, // Adjusted from 120 to compensate for shorter canvas (60% height)
    orbit: { min: 60, max: 80 }, // Generous zoom limits for mobilealed down zoom limits for closer camera
    label: { distanceX: 22, distanceZ: 15, fontSize: 1.1 },
  },
  tablet: {
    cameraZ: 85, // Medium distance
    orbit: { min: 60, max: 120 },
    label: { distanceX: 28, distanceZ: 20, fontSize: 1.2 },
  },
  desktop: {
    cameraZ: 60, // Closest default distance
    orbit: { min: 60, max: 90 }, // Tighter zoom limits on desktop
    label: { distanceX: 30, distanceZ: 20, fontSize: 1.5 },
  },
};

export default function useResponsiveConfig() {
  const { size } = useThree();

  // Memoize the config retrieval for performance so it doesn't recalculate unless window width fundamentally changes
  return useMemo(() => {
    if (size.width < BREAKPOINTS.mobile) return RESPONSIVE_CONFIG.mobile;
    if (size.width < BREAKPOINTS.tablet) return RESPONSIVE_CONFIG.tablet;
    return RESPONSIVE_CONFIG.desktop;
  }, [size.width]);
}
