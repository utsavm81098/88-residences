import React from "react";
import { OrbitControls } from "@react-three/drei";
import useAdaptiveControls from "./use-adaptive-controls";

const AdaptiveControls = ({ controlsRef }) => {
  const { orbitLimits, onStart, onEnd, POLAR, TARGET } =
    useAdaptiveControls(controlsRef);

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
      minDistance={orbitLimits.min}
      maxDistance={orbitLimits.max}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
};

export default AdaptiveControls;
