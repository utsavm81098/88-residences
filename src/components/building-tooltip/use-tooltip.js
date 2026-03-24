import { useState, useCallback, useRef } from "react";

const useTooltip = () => {
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    unit: null,
  });

  // Ref to the tooltip DOM element — position written directly, no re-render
  const tooltipElRef = useRef(null);

  const showTooltip = useCallback((unit, x, y) => {
    setTooltipState({ visible: true, unit });
    // Write position immediately without waiting for re-render
    requestAnimationFrame(() => {
      positionTooltip(tooltipElRef.current, x, y);
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipState({ visible: false, unit: null });
  }, []);

  // Called on every onPointerMove — NO setState, just direct DOM write
  const moveTooltip = useCallback((x, y) => {
    if (tooltipElRef.current) {
      positionTooltip(tooltipElRef.current, x, y);
    }
  }, []);

  return { tooltipState, tooltipElRef, showTooltip, hideTooltip, moveTooltip };
};

// ── Pure helper — calculates clamped position and writes to DOM directly ──
function positionTooltip(el, x, y) {
  if (!el) return;

  const OFFSET_X = 16;
  const OFFSET_Y = 16; // below-right of cursor

  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let finalX = x + OFFSET_X;
  let finalY = y + OFFSET_Y;

  // Flip left if overflowing right edge
  if (finalX + rect.width > vw - 8) {
    finalX = x - rect.width - OFFSET_X;
  }

  // Flip up if overflowing bottom edge
  if (finalY + rect.height > vh - 8) {
    finalY = y - rect.height - OFFSET_Y;
  }

  el.style.transform = `translate(${finalX}px, ${finalY}px)`;
}

export default useTooltip;
