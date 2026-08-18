import { useThree } from "@react-three/fiber";
import { useMemo } from "react";

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

const RESPONSIVE_CONFIG = {
  mobile: {
    cameraZ: 45, // Reference distance (used by building transitions)
    orbit: { min: 27, max: 60 }, // Generous zoom limits for mobile
    label: { distanceX: 25, distanceZ: 18, fontSize: 1.2 },
  },
  tablet: {
    cameraZ: 50, // Reference distance (used by building transitions)
    orbit: { min: 33, max: 60 },
    label: { distanceX: 28, distanceZ: 20, fontSize: 1.2 },
  },
  desktop: {
    cameraZ: 55, // Reference distance (used by building transitions)
    orbit: { min: 39, max: 60 }, // Tighter zoom limits on desktop
    label: { distanceX: 30, distanceZ: 20, fontSize: 1.5 },
  },
};

export default function useResponsiveConfig() {
  const { size } = useThree();

  // Memoize the config retrieval for performance so it doesn't recalculate unless window width fundamentally changes
  return useMemo(() => {
    const windowWidth = window.innerWidth;
    if (windowWidth < BREAKPOINTS.mobile) return RESPONSIVE_CONFIG.mobile;
    if (windowWidth < BREAKPOINTS.tablet) return RESPONSIVE_CONFIG.tablet;
    return RESPONSIVE_CONFIG.desktop;
  }, [size.width]);
}
