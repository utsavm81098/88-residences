import { useMemo } from "react";
import { useMatches } from "react-router";

/**
 * useKeepAliveKey — the single definition of "which keep-alive route is
 * active". Reads react-router's match chain rather than sniffing
 * `location.pathname` for a suffix, so the language prefix (/dashboard-en) and
 * any future nesting can never desync it from the router.
 *
 * Scans deepest-match-first so a nested route can override its parent.
 *
 * @returns {string | null} the active route's `handle.keepAlive` key
 */
export const useKeepAliveKey = () => {
  const matches = useMatches();

  return useMemo(() => {
    for (let index = matches.length - 1; index >= 0; index -= 1) {
      const key = matches[index]?.handle?.keepAlive;
      if (key) return key;
    }
    return null;
  }, [matches]);
};

export default useKeepAliveKey;
