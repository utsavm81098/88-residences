import { useSelector } from "react-redux";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { extractDigit } from "@/utils/helper";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Hook for BuildingTooltip feature.
 * Handles mouse tracking, animations, and state for hover tooltips and selections.
 */
export const useBuildingTooltip = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "en";

  const visible = useSelector((state) => state.tooltip.visible);
  const unit = useSelector((state) => state.tooltip.unit);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);
  const selectedBuilding = useSelector(
    (state) => state.building.currentBuilding,
  );
  const isMobile = useIsMobile();

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
  const desktopPopupRef = useRef(null);

  // Keep track of active state and current unit for the global event listener without triggering re-renders
  const isActiveRef = useRef(showHoverTooltip);
  isActiveRef.current = showHoverTooltip;

  const unitRef = useRef(unit);
  unitRef.current = unit;

  // ── Performance Optimizations: Dimension & Logic Caching ──────────
  const dimensionsRef = useRef({ width: 280, height: 140 });
  const floorConfigRef = useRef({ isLowFloor: false });
  const rafIdRef = useRef(null);

  // Measure dimensions and pre-calculate floor logic only when unit/visibility changes
  useEffect(() => {
    if (showHoverTooltip && hoverTooltipRef.current) {
      const el = hoverTooltipRef.current;

      const timeout = setTimeout(() => {
        dimensionsRef.current = {
          width: el.offsetWidth || 280,
          height: el.offsetHeight || 140,
        };
      }, 0);

      const floorStr = unit?.floor_no?.slug || unit?.floor_no?.name || "";
      const extractedFloor = extractDigit(floorStr);
      const floorNum = parseInt(extractedFloor);

      floorConfigRef.current = {
        isLowFloor: !isNaN(floorNum) && floorNum <= 2,
        hasFloorInfo: !isNaN(floorNum),
      };

      return () => clearTimeout(timeout);
    }
  }, [showHoverTooltip, unit]);

  // ── Mouse position Tracking ────
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isActiveRef.current || !hoverTooltipRef.current) return;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);

      rafIdRef.current = requestAnimationFrame(() => {
        const el = hoverTooltipRef.current;
        if (!el) return;

        const { clientX: x, clientY: y } = e;
        const OFFSET_X = 16;
        const OFFSET_Y = 16;

        const { width, height } = dimensionsRef.current;
        const { isLowFloor, hasFloorInfo } = floorConfigRef.current;

        let posX = x + OFFSET_X;
        let posY;
        if (hasFloorInfo) {
          posY = isLowFloor ? y - height - OFFSET_Y : y + OFFSET_Y;
        } else {
          const THRESHOLD_Y = window.innerHeight * 0.5;
          posY = y < THRESHOLD_Y ? y + OFFSET_Y : y - height - OFFSET_Y;
        }

        if (posX + width > window.innerWidth) {
          posX = x - width - OFFSET_X;
        }

        if (posX < 0) posX = 0;
        if (posY < 0) posY = 0;
        if (posY + height > window.innerHeight) {
          posY = window.innerHeight - height;
        }

        el.style.transform = `translate(${posX}px, ${posY}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ── Desktop selection popup animation ────
  useEffect(() => {
    const node = desktopPopupRef.current;
    if (!node) return;

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

    // Fix 4: Kill any active tween on this node when selectedUnit changes or component unmounts
    return () => {
      gsap.killTweensOf(node);
    };
  }, [selectedUnit]);

  // Derive status from unit data
  const status = useMemo(() => {
    if (!unit) return null;
    return unit.status || (unit.apartment_sold ? "sold" : "available");
  }, [unit]);

  return {
    t,
    lang,
    unit,
    status,
    selectedUnit,
    selectedBuilding,
    showHoverTooltip,
    desktopPopupRef,
    hoverTooltipRef,
    isMobile,
  };
};

export default useBuildingTooltip;
