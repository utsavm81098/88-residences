import { useState, useEffect, useMemo } from "react";

/**
 * Gets the computed vertical margins (top + bottom) of an element in pixels.
 * @param {HTMLElement} el The DOM element to measure
 * @returns {number} The sum of top and bottom margins
 */
const getVerticalMargins = (el) => {
  if (!el || typeof window === "undefined") return 0;
  try {
    const style = window.getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return marginTop + marginBottom;
  } catch (e) {
    return 0;
  }
};

/**
 * Hook to dynamically measure and sum the heights of one or more DOM elements.
 * @param {number} defaultHeight Fallback height if elements are not in DOM
 * @param {string|string[]} elementIds Single ID or array of IDs to measure
 * @returns {{ bottomMenuHeight: number }} Object containing the combined height
 */
export default function useBottomMenuHeight(
  defaultHeight = 52,
  elementIds = "bottomMenu",
) {
  const [combinedHeight, setCombinedHeight] = useState(defaultHeight);

  // Normalize to a stable array representation using a string key to prevent recreation on inline array inputs
  const idsKey = Array.isArray(elementIds) ? elementIds.join(",") : elementIds;
  const ids = useMemo(() => idsKey.split(","), [idsKey]);

  useEffect(() => {
    const observers = [];
    const pollIntervals = [];
    const heights = {};

    const updateCombinedHeight = () => {
      const total = ids.reduce((sum, id) => sum + (heights[id] || 0), 0);
      if (total > 0) {
        setCombinedHeight((prev) => (prev !== total ? total : prev));
      }
    };

    const setupObserver = (id, el) => {
      const getElementHeightWithMargins = (element) => {
        const height = element.getBoundingClientRect().height;
        const margins = getVerticalMargins(element);
        return height + margins;
      };

      heights[id] = getElementHeightWithMargins(el);
      updateCombinedHeight();

      const observer = new ResizeObserver(() => {
        const totalHeight = getElementHeightWithMargins(el);
        if (totalHeight > 0) {
          heights[id] = totalHeight;
          updateCombinedHeight();
        }
      });
      observer.observe(el);
      observers.push(observer);
    };

    ids.forEach((id) => {
      const targetEl = document.getElementById(id);
      if (targetEl) {
        setupObserver(id, targetEl);
      } else {
        // Fallback default value for this specific ID if not mounted yet
        heights[id] = id === "bottomMenu" ? 52 : id === "mobileTopBar" ? 68 : 0;
        updateCombinedHeight();

        // Use a highly efficient polling mechanism instead of a heavy MutationObserver on document.body
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max (100 * 100ms)
        const intervalId = setInterval(() => {
          attempts++;
          const el = document.getElementById(id);
          if (el) {
            setupObserver(id, el);
            clearInterval(intervalId);
          } else if (attempts >= maxAttempts) {
            clearInterval(intervalId);
          }
        }, 100);
        pollIntervals.push(intervalId);
      }
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
      pollIntervals.forEach((intervalId) => clearInterval(intervalId));
    };
  }, [idsKey, ids]);

  return useMemo(
    () => ({ bottomMenuHeight: combinedHeight }),
    [combinedHeight],
  );
}

