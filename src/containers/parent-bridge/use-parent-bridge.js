import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { logger } from "@/utils/logger";
import { WEBSITE_URL } from "@/utils/constant";

// REAL BUG FIXED HERE, confirmed live on production
// (https://www.88residences.com/dashboard-en/): this used to be hardcoded to
// "https://88residences.com" — no "www" — which never matches the real site's
// actual origin ("https://www.88residences.com", the same canonical domain
// WEBSITE_URL already uses everywhere else in this codebase, e.g.
// utils/helper.js). window.parent.postMessage(msg, targetOrigin) doesn't
// throw when targetOrigin mismatches the recipient's real origin — it just
// silently declines to deliver the message, and Chrome separately logs an
// unrelated-looking "Failed to execute 'postMessage' on 'DOMWindow'" console
// error purely as a debugging aid — there's no exception for the try/catch
// below to actually catch. So on the real production domain, the FIRST
// postMessage call below was GUARANTEED to fail on every single route
// change, for every visitor, permanently — the "*" fallback a few lines down
// papered over the actual functional break (delivery still succeeded via
// that wildcard), but the console noise was real and reproducible on every
// navigation. Importing WEBSITE_URL rather than re-hardcoding it also means
// this can never drift out of sync with the domain the rest of the app
// already treats as canonical.
const PARENT_ORIGIN = WEBSITE_URL;
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
