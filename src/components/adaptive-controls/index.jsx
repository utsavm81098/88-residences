import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const POLAR = { min: 1.1, max: 1.5 };

const getDistances = (width) => {
  if (width < 768) return { min: 55, max: 140 }; // mobile
  if (width < 1024) return { min: 55, max: 120 }; // tablet
  return { min: 56, max: 90 }; // desktop
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
      // ✅ target matches where the building sits visually
      target={[0, 5, 0]}
      enablePan={false}
      enableZoom
      rotateSpeed={0.5}
      minPolarAngle={POLAR.min}
      maxPolarAngle={POLAR.max}
      // ✅ Applied directly as props — no setTimeout race condition
      minDistance={distances.min}
      maxDistance={distances.max}
    />
  );
};

export default AdaptiveControls;
