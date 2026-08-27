import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

// Minimum time drei's global loading-manager activity must stay
// continuously "busy" before this hook reports it. Without this, an
// already-cached GLB (Suspense resolving in a handful of milliseconds)
// would flash a spinner for one frame on every building switch — this
// filters that out so only a genuinely slow, still-downloading asset
// (the real mobile-network case) gets reported.
const DEFAULT_SHOW_DELAY_MS = 200;

/**
 * useSceneLoadingProgress - debounced view onto drei's useProgress().
 *
 * useProgress reflects THREE.DefaultLoadingManager activity across every
 * useGLTF/useTexture/useEnvironment call in the app — by design there is
 * only one loading manager, so `active` is a global "is anything still
 * streaming in" signal, not scoped to one caller's own resource. This hook
 * adds debounced show/hide on top of that signal so callers can drive a
 * non-blocking "still loading" indicator without hand-rolling the timer
 * themselves in every place that wants one.
 *
 * Deliberately generic/reusable (no building- or scene-specific knowledge)
 * so it lives in the shared hooks folder rather than co-located with one
 * feature — see .agents/rules/hooks-guidelines.md.
 */
export const useSceneLoadingProgress = ({
  delayMs = DEFAULT_SHOW_DELAY_MS,
} = {}) => {
  const { active } = useProgress();
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (active) {
      timerRef.current = setTimeout(() => setIsLoading(true), delayMs);
    } else {
      clearTimeout(timerRef.current);
      setIsLoading(false);
    }

    return () => clearTimeout(timerRef.current);
  }, [active, delayMs]);

  return { isLoading };
};

export default useSceneLoadingProgress;
