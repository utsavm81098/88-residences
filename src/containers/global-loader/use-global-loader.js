import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";

/**
 * Container hook for GlobalLoader. Thin by design: the one-way latch itself
 * lives in Redux (store/slices/app-loader-slice.js) precisely so it survives
 * this component's parent re-rendering and, more importantly, is fed from
 * two independent per-route sites (containers/home/use-home.js and
 * containers/inventory/use-inventory.js) without either needing to know
 * about the other — see the slice's own doc comment.
 */
export const useGlobalLoader = () => {
  const isReady = useSelector((state) => state.appLoader.initialLoadComplete);
  const hasDispatchedRef = useRef(false);

  useEffect(() => {
    if (isReady && !hasDispatchedRef.current) {
      hasDispatchedRef.current = true;
      console.log("Carousel finished, 3D render active");

      if (
        typeof window !== "undefined" &&
        window.parent &&
        window.parent !== window
      ) {
        window.parent.postMessage(
          {
            type: "88residences:ui-state",
            carousel: "finished",
          },
          "*",
        );
      }
    }
  }, [isReady]);

  return { isReady };
};

export default useGlobalLoader;

