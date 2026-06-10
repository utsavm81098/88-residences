import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook to copy text to clipboard with a temporary success state.
 */
export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);
  const timerRef = useRef(null);

  // Fix 5: Clear any pending timer on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    (text) => {
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        // Clear any existing timer before setting a new one
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        setHasCopied(true);
        timerRef.current = setTimeout(() => {
          setHasCopied(false);
          timerRef.current = null;
        }, timeout);
      });
    },
    [timeout],
  );

  return { hasCopied, copy };
}
