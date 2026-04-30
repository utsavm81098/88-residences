import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

const RESPONSIVE_CONFIG = {
  mobile: {
    cameraZ: 80, // Pushed further back on mobile
    orbit: { min: 50, max: 140 }, // Generous zoom limits for mobile
    label: { distanceX: 25, distanceZ: 18, fontSize: 1.2 },
  },
  tablet: {
    cameraZ: 60, // Medium distance
    orbit: { min: 60, max: 120 },
    label: { distanceX: 28, distanceZ: 20, fontSize: 1.2 },
  },
  desktop: {
    cameraZ: 70, // Closest default distance
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
