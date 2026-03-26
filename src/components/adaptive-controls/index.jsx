import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const POLAR = { min: 1.1, max: 1.5 };
const TARGET = [0, 10, 0];

const getDistances = (width) => {
  if (width < 768) return { min: 55, max: 140 };
  if (width < 1024) return { min: 55, max: 120 };
  return { min: 60, max: 90 };
};

const AdaptiveControls = ({ controlsRef }) => {
  const { size } = useThree();
  const distances = useMemo(() => getDistances(size.width), [size.width]);

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
      minDistance={distances.min}
      maxDistance={distances.max}
    />
  );
};

export default AdaptiveControls;
