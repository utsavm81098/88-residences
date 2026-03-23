import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const POLAR = { min: 1.1, max: 1.5 };

const getDistances = (width) => {
  if (width < 768) return { min: 40, max: 140 }; // mobile
  if (width < 1024) return { min: 40, max: 120 }; // tablet
  return { min: 40, max: 90 }; // desktop
};

const AdaptiveControls = ({ controlsRef }) => {
  const { size } = useThree(); // ✅ gets canvas width & height in pixels

  const distances = useMemo(() => getDistances(size.width), [size.width]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!controlsRef.current) return;
      controlsRef.current.minDistance = distances.min;
      controlsRef.current.maxDistance = distances.max;
      controlsRef.current.minPolarAngle = POLAR.min;
      controlsRef.current.maxPolarAngle = POLAR.max;
      controlsRef.current.update();
    }, 100);

    return () => clearTimeout(timer);
  }, [distances, controlsRef]); // ✅ re-runs whenever canvas size changes (resize / rotate)

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      target={[0, 5, 0]}
      enablePan={false}
      enableZoom
      rotateSpeed={0.5}
    />
  );
};

export default AdaptiveControls;
