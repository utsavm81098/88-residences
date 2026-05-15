import { useState, useCallback } from "react";

/**
 * Hook to copy text to clipboard with a temporary success state.
 */
export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(
    (text) => {
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), timeout);
      });
    },
    [timeout],
  );

  return { hasCopied, copy };
}
