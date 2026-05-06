import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setDragging } from "@/store/slices/drag-slice";
import { hideTooltip } from "@/store/slices/tooltip-slice";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";

export const useAdaptiveControls = (controlsRef) => {
  const config = useResponsiveConfig();
  const dispatch = useDispatch();

  const onStart = useCallback(() => {
    dispatch(setDragging(true));
    dispatch(hideTooltip());
  }, [dispatch]);

  const onEnd = useCallback(() => {
    dispatch(setDragging(false));
  }, [dispatch]);

  const POLAR = { min: 1.22, max: 1.5 };
  const TARGET = [0, 10, 0];

  return {
    config,
    onStart,
    onEnd,
    POLAR,
    TARGET,
  };
};

export default useAdaptiveControls;
