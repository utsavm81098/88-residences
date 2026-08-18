import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { logger } from "@/utils/logger";

const PARENT_ORIGIN = "https://88residences.com";
const MESSAGE_TYPE = "88residences:ui-state";

/**
 * useParentBridge — Synchronizes iframe route and view state with the parent host window (WordPress).
 *
 * Performance Characteristics:
 * - Time Complexity: O(1) per route change (constant-time path string concatenation and string compare).
 * - Space Complexity: O(1) (fixed-size payload, single ref for memoized path string).
 * - Zero unnecessary renders or duplicate postMessage transmissions via memoized path ref.
 */
export function useParentBridge() {
  const location = useLocation();
  const lastDispatchedPathRef = useRef(null);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    // Deduplicate: Skip dispatch if path has not changed
    if (lastDispatchedPathRef.current === currentPath) {
      return;
    }
    lastDispatchedPathRef.current = currentPath;

    // Fast O(1) lookup to determine master view (home) vs inner view (inventory)
    const cleanPath = location.pathname.replace(/\/$/, "") || "/";
    const isMaster = !cleanPath.endsWith("/inventory");

    const statePayload = {
      type: MESSAGE_TYPE,

      /*
       * Parent header state
       */
      header: isMaster ? "show" : "hide",

      /*
       * Current application view
       */
      view: isMaster ? "master" : "inner",

      /*
       * Current iframe route
       */
      path: currentPath,
    };

    /*
     * Send state to WordPress parent.
     */
    if (typeof window !== "undefined" && window.parent) {
      try {
        window.parent.postMessage(statePayload, PARENT_ORIGIN);

        // Support environments where the parent origin differs (e.g. www subdomain or demo staging)
        if (window.location.origin !== PARENT_ORIGIN) {
          window.parent.postMessage(statePayload, "*");
        }
      } catch (error) {
        logger.warn("[ParentBridge] Error posting message to parent:", error);
      }
    }

    if (import.meta.env.DEV) {
      console.log("[88 Residence] Parent state:", {
        header: isMaster ? "show" : "hide",
        view: isMaster ? "master" : "inner",
        path: currentPath,
      });
    }
  }, [location.pathname, location.search, location.hash]);
}

export default useParentBridge;
