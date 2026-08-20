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
 */
export const useKeepAliveOutlet = () => {
  const activeKey = useKeepAliveKey();
  const [visited, setVisited] = useState(() => new Set());

  useEffect(() => {
    if (!activeKey || !ENV_CONFIG.KEEP_ALIVE_ROUTES) return;
    if (!KEEP_ALIVE_VIEWS[activeKey]) return;

    setVisited((previous) =>
      previous.has(activeKey) ? previous : new Set(previous).add(activeKey),
    );
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

    const keys = ENV_CONFIG.KEEP_ALIVE_ROUTES
      ? Array.from(new Set([...visited, activeKey]))
      : [activeKey];

    return keys.map((key) => ({
      key,
      Component: KEEP_ALIVE_VIEWS[key],
      isActive: key === activeKey,
    }));
  }, [activeKey, visited]);

  return { data: { activeKey, views } };
};

export default useKeepAliveOutlet;
