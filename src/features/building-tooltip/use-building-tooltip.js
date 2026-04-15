import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export const useBuildingTooltip = () => {
  // Use granular selectors to avoid re-rendering when other tooltip properties (x, y) change
  const visible = useSelector((state) => state.tooltip.visible);
  const unit = useSelector((state) => state.tooltip.unit);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);

  // Do not render hover tooltip for the currently selected unit
  const showHoverTooltip =
    visible && unit && (!selectedUnit || selectedUnit.name !== unit.name);

  // GSAP animation references
  const desktopPopupRef = useRef(null);
  const hoverTooltipRef = useRef(null);

  // Keep track of active state for the global event listener without requiring dependency arrays
  const isActiveRef = useRef(showHoverTooltip);
  isActiveRef.current = showHoverTooltip;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isActiveRef.current || !hoverTooltipRef.current) return;

      const { clientX: x, clientY: y } = e;
      const OFFSET_X = 16;
      const OFFSET_Y = 16;

      let width = 280;
      let height = 140;

      // Extract accurate runtime sizes
      if (hoverTooltipRef.current) {
        width = hoverTooltipRef.current.offsetWidth || width;
        height = hoverTooltipRef.current.offsetHeight || height;
      }

      let posX = x + OFFSET_X;
      let posY = y + OFFSET_Y;

      // Fallback 1: If too close to bottom, show tooltip above the cursor
      if (typeof window !== "undefined" && posY + height > window.innerHeight) {
        posY = y - height - OFFSET_Y;
      }

      // Fallback 2: If too close to right edge, show tooltip left of cursor
      if (typeof window !== "undefined" && posX + width > window.innerWidth) {
        posX = x - width - OFFSET_X;
      }

      // Direct DOM mutation completely bypasses React Render Cycle for high-frequency updates
      hoverTooltipRef.current.style.transform = `translate(${posX}px, ${posY}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  return {
    unit,
    selectedUnit,
    showHoverTooltip,
    desktopPopupRef,
    hoverTooltipRef,
  };
};

export default useBuildingTooltip;
