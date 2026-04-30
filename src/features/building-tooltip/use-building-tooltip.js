import { useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";

export const useBuildingTooltip = () => {
  const visible = useSelector((state) => state.tooltip.visible);
  const unit = useSelector((state) => state.tooltip.unit);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);
  const selectedBuilding = useSelector(
    (state) => state.building.currentBuilding,
  );

  // Memoize derived boolean — avoids recalculation on unrelated renders
  const showHoverTooltip = useMemo(() => {
    if (!visible || !unit) return false;
    if (!selectedUnit) return true;
    const selectedId = selectedUnit.title || selectedUnit.apartment_number;
    const hoveredId = unit.title || unit.apartment_number;
    return selectedId !== hoveredId;
  }, [visible, unit, selectedUnit]);

  // GSAP animation references
  const hoverTooltipRef = useRef(null);

  // Keep track of active state for the global event listener without triggering re-renders
  const isActiveRef = useRef(showHoverTooltip);
  isActiveRef.current = showHoverTooltip;

  // ── Mouse position → direct DOM mutation (bypasses React render cycle) ────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isActiveRef.current || !hoverTooltipRef.current) return;

      const { clientX: x, clientY: y } = e;
      const OFFSET_X = 16;
      const OFFSET_Y = 16;

      const el = hoverTooltipRef.current;
      const width = el.offsetWidth || 280;
      const height = el.offsetHeight || 140;

      let posX = x + OFFSET_X;
      let posY = y + OFFSET_Y;

      // Flip above cursor if too close to bottom
      if (posY + height > window.innerHeight) {
        posY = y - height - OFFSET_Y;
      }

      // Flip left of cursor if too close to right edge
      if (posX + width > window.innerWidth) {
        posX = x - width - OFFSET_X;
      }

      // Direct DOM mutation — zero React overhead
      el.style.transform = `translate(${posX}px, ${posY}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // ── Desktop popup entrance/exit animation (useEffect pattern) ──────────
  const desktopPopupRef = useRef(null);

  useEffect(() => {
    const node = desktopPopupRef.current;
    if (!node) return;

    // Clean up any ongoing animations to prevent conflict
    gsap.killTweensOf(node);

    if (selectedUnit) {
      gsap.fromTo(
        node,
        {
          opacity: 0,
          y: -20,
          scale: 0.95,
          transformOrigin: "top right",
          pointerEvents: "none",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          ease: "back.out(1.2)",
          pointerEvents: "auto",
        },
      );
    } else {
      gsap.to(node, {
        opacity: 0,
        y: -20,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.in",
        pointerEvents: "none",
      });
    }
  }, [selectedUnit]);

  // Derive status from unit data
  const status = useMemo(() => {
    if (!unit) return null;
    return unit.status || (unit.apartment_sold ? "sold" : "available");
  }, [unit]);

  return {
    unit,
    status,
    selectedUnit,
    selectedBuilding,
    showHoverTooltip,
    desktopPopupRef,
    hoverTooltipRef,
  };
};

export default useBuildingTooltip;
