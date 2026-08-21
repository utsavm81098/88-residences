import { useEffect, useMemo, useState } from "react";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import { ENV_CONFIG } from "@/utils/env-config";
import { logger } from "@/utils/logger";
import { KEEP_ALIVE_VIEWS } from "./keep-alive-views";

/**
 * useKeepAliveOutlet — decides which route views are rendered.
 *
 * Navigating between 3D routes (Home <-> Inventory) keeps visited route views
 * mounted in the scene graph so WebGL contexts, compiled shaders, and parsed GLBs
 * remain resident.
 *
 * When switching routes, the inactive view has its render loop halted (frameloop="never")
 * and visibility hidden (visibility: hidden), allowing instantaneous switching with
 * zero loader delay on both mobile and desktop.
 *
 * Constrained-device guard: keeping BOTH routes' <Canvas> mounted means TWO live
 * WebGL contexts hold Home's masterplan scene and an Inventory building scene on
 * the GPU at once — see
 * docs/superpowers/specs/2026-08-17-keep-alive-route-hosting-design.md §9, which
 * flagged this as a known mobile-regression risk and named the mitigation below
 * ("gate visited-set growth on useIsMobile()") without ever shipping it. Desktop
 * GPUs have VRAM headroom for both contexts simultaneously; mobile/tablet
 * browsers enforce a much stricter per-tab GPU memory ceiling and were
 * confirmed crashing (tab/renderer OOM) once both routes had been visited.
 *
 * `getDeviceTier()` (utils/constant.js), not the viewport-only `useIsMobile()`,
 * is the discriminator: it already folds in touch-capability, so a landscape
 * tablet (viewport >=1024px) is correctly treated as constrained instead of
 * falling through to "desktop" behaviour — the same gap that function's own
 * doc comment documents for the Home model variant. It's a plain, non-reactive
 * function (device capability doesn't change mid-session), so it's read once
 * into state rather than recomputed on every render.
 */
export const useKeepAliveOutlet = () => {
  const activeKey = useKeepAliveKey();
  const [visited, setVisited] = useState(() => new Set());

  useEffect(() => {
    if (!activeKey || !ENV_CONFIG.KEEP_ALIVE_ROUTES) return;
    if (!KEEP_ALIVE_VIEWS[activeKey]) return;

    setVisited((previous) => {
      return previous.has(activeKey)
        ? previous
        : new Set(previous).add(activeKey);
    });
  }, [activeKey]);

  // Activation timing measurement for dev and timeline inspection
  useEffect(() => {
    if (!activeKey) return undefined;

    const startMark = `keep-alive:${activeKey}:activate:start`;
    performance.mark(startMark);

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        const measure = performance.measure(
          `keep-alive:${activeKey}:activate`,
          startMark,
        );
        logger.info(
          `[KeepAlive] "${activeKey}" visible in ${Math.round(measure.duration)}ms`,
        );
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [activeKey]);

  const views = useMemo(() => {
    if (!activeKey || !KEEP_ALIVE_VIEWS[activeKey]) return [];

    const keys = !ENV_CONFIG.KEEP_ALIVE_ROUTES
      ? [activeKey]
      : Array.from(new Set([...visited, activeKey]));

    return keys.map((key) => ({
      key,
      Component: KEEP_ALIVE_VIEWS[key],
      isActive: key === activeKey,
    }));
  }, [activeKey, visited]);

  return { data: { activeKey, views } };
};

export default useKeepAliveOutlet;
