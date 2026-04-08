import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

const BASE_FOV = 35; // Must match the PerspectiveCamera fov in scene-environment
// Pre-calculate tangent of half-FOV at module level to avoid re-computing every frame
const HALF_BASE_RAD_TAN = Math.tan((BASE_FOV * Math.PI) / 360);

/**
 * CameraStabilizer
 *
 * Prevents the "zoom jump" when the canvas container height changes
 * (e.g. when the mobile bottom sheet opens and shrinks the canvas).
 *
 * How it works:
 *   - Captures the full canvas height on mount (before any bottom sheet opens)
 *   - Every frame, checks the current canvas height
 *   - If the height shrinks, reduces the camera FOV proportionally so the
 *     building maintains the exact same on-screen size
 *   - When height is restored, FOV resets to the base value
 *
 * Math: newFOV = 2 * atan(tan(baseFOV/2) * (currentHeight / fullHeight))
 */
const CameraStabilizer = () => {
  const { camera, gl } = useThree();
  const fullHeight = useRef(null);

  useFrame(() => {
    // Only apply FOV compensation on mobile (< 768px)
    if (window.innerWidth >= 768) return;

    const currentHeight = gl.domElement.clientHeight;

    // On first frame, capture the full canvas height as our reference
    if (fullHeight.current === null) {
      fullHeight.current = currentHeight;
    }

    // If the canvas is back at full size (or close), update our reference
    // This handles window resizes correctly
    if (currentHeight >= fullHeight.current) {
      fullHeight.current = currentHeight;

      // Restore base FOV
      if (Math.abs(camera.fov - BASE_FOV) > 0.05) {
        camera.fov = BASE_FOV;
        camera.updateProjectionMatrix();
      }
      return;
    }

    // Canvas is smaller than full height → compensate FOV
    const ratio = currentHeight / fullHeight.current;

    if (ratio > 0.1) {
      const newFov = (2 * Math.atan(HALF_BASE_RAD_TAN * ratio) * 180) / Math.PI;

      // Only update if meaningful change (avoids unnecessary projection recalcs)
      if (Math.abs(camera.fov - newFov) > 0.05) {
        camera.fov = newFov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
};

export default CameraStabilizer;
