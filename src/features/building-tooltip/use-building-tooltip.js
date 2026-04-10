import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export const useBuildingTooltip = () => {
  const tooltipState = useSelector((state) => state.tooltip);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);

  const { visible, unit, x, y } = tooltipState;

  // Do not render hover tooltip for the currently selected unit
  const showHoverTooltip =
    visible && unit && (!selectedUnit || selectedUnit.name !== unit.name);

  // Reference for GSAP animation
  const desktopPopupRef = useRef(null);

  useEffect(() => {
    let tween;
    if (selectedUnit && desktopPopupRef.current) {
      tween = gsap.fromTo(
        desktopPopupRef.current,
        { opacity: 0, y: -40, scale: 0.95, transformOrigin: "top right" },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" },
      );
    }
    return () => {
      if (tween) tween.kill();
    };
  }, [selectedUnit]);

  const OFFSET_X = 16;
  const OFFSET_Y = 16;

  return {
    unit,
    x,
    y,
    selectedUnit,
    showHoverTooltip,
    desktopPopupRef,
    OFFSET_X,
    OFFSET_Y,
  };
};

export default useBuildingTooltip;
