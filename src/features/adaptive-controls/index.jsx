import { OrbitControls } from "@react-three/drei";
import useResponsiveConfig from "../../hooks/useResponsiveConfig";

const POLAR = { min: 1.1, max: 1.5 };
const TARGET = [0, 10, 0];

const AdaptiveControls = ({ controlsRef }) => {
  const config = useResponsiveConfig();

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      target={TARGET}
      enablePan={false}
      enableZoom
      rotateSpeed={0.5}
      minPolarAngle={POLAR.min}
      maxPolarAngle={POLAR.max}
      minDistance={config.orbit.min}
      maxDistance={config.orbit.max}
    />
  );
};

export default AdaptiveControls;
