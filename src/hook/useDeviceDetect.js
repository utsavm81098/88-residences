import { useState, useEffect, useMemo } from "react";

/**
 * Hook that detects device type based on screen size AND touch capability.
 * Returns device info that components can use for responsive behavior.
 */
const useDeviceDetect = () => {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setScreenWidth(window.innerWidth);
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const device = useMemo(() => {
    const isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches);

    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;
    const isDesktop = screenWidth >= 1024;

    return {
      isTouchDevice,
      isMobile,
      isTablet,
      isDesktop,
      screenWidth,
      // Convenience: true for both mobile and tablet
      isMobileOrTablet: isMobile || isTablet,
    };
  }, [screenWidth]);

  return device;
};

export default useDeviceDetect;
