import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * A directional light that follows the camera position.
 * Intensity adapts based on viewing angle:
 *   - South/East side (HDR already lit) → lower intensity
 *   - North/West side (HDR dark side)   → full intensity
 */
const CameraLight = ({
  maxIntensity = 0.7,
  minIntensity = 0.2,
  color = "#ffffff",
}) => {
  const lightRef = useRef();

  useFrame(({ camera }) => {
    if (!lightRef.current) return;

    // Place the light at the camera's position
    lightRef.current.position.copy(camera.position);

    // Calculate how "south-facing" the camera is
    // atan2(x, z): south = ~0, north = ~±PI, east = ~PI/2, west = ~-PI/2
    const angle = Math.atan2(camera.position.x, camera.position.z);

    // cos(angle) = 1 when south (z+), -1 when north (z-)
    // Map: south → 0 (low), north → 1 (high)
    const northFactor = (1 - Math.cos(angle)) / 2; // 0 at south, 1 at north

    // Blend intensity: low when south, high when north/west
    lightRef.current.intensity =
      minIntensity + (maxIntensity - minIntensity) * northFactor;
  });

  return (
    <directionalLight
      ref={lightRef}
      intensity={maxIntensity}
      color={color}
    />
  );
};

export default CameraLight;
