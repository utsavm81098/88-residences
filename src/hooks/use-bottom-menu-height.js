import { useState, useEffect } from "react";

/**
 * Hook to dynamically measure the height of the #bottomMenu element.
 * @param {number} defaultHeight Fallback height if element is not in DOM
 * @returns {{ bottomMenuHeight: number }} Object containing measured height
 */
export default function useBottomMenuHeight(defaultHeight = 52) {
  const [bottomMenuHeight, setBottomMenuHeight] = useState(defaultHeight);

  useEffect(() => {
    let elementObserver;
    let mutationObserver;

    const setupElementObserver = (el) => {
      const initialHeight = el.getBoundingClientRect().height;
      if (initialHeight > 0) {
        setBottomMenuHeight(initialHeight);
      }

      elementObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height;
          if (height > 0) {
            setBottomMenuHeight(height);
          }
        }
      });
      elementObserver.observe(el);
    };

    const targetEl = document.getElementById("bottomMenu");
    if (targetEl) {
      setupElementObserver(targetEl);
    } else {
      // If the element isn't in the DOM yet, observe the body for changes
      mutationObserver = new MutationObserver((mutations, obs) => {
        const el = document.getElementById("bottomMenu");
        if (el) {
          setupElementObserver(el);
          obs.disconnect(); // Stop mutation observer once element is found
        }
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (elementObserver) {
        elementObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    };
  }, []);

  return { bottomMenuHeight };
}
