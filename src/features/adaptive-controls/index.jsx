import React, { useCallback } from "react";
import { OrbitControls } from "@react-three/drei";
import useResponsiveConfig from "../../hooks/use-responsive-config";
import { useDispatch } from "react-redux";
import { setDragging } from "../../store/slices/drag-slice";
import { hideTooltip } from "../../store/slices/tooltip-slice";

const POLAR = { min: 1.1, max: 1.5 };
const TARGET = [0, 10, 0];

const AdaptiveControls = ({ controlsRef }) => {
  const config = useResponsiveConfig();
  const dispatch = useDispatch();

  const onStart = useCallback(() => {
    dispatch(setDragging(true));
    dispatch(hideTooltip());
  }, [dispatch]);

  const onEnd = useCallback(() => {
    dispatch(setDragging(false));
  }, [dispatch]);

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
      onStart={onStart}
      onEnd={onEnd}
    />
  );
};

export default AdaptiveControls;
