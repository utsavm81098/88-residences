import { useEffect, useMemo, useState } from "react";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import { ENV_CONFIG } from "@/utils/env-config";
import { logger } from "@/utils/logger";
import { KEEP_ALIVE_VIEWS } from "./keep-alive-views";

/**
 * useKeepAliveOutlet — decides which route views are rendered.
 *
 * Navigating between two <Canvas>-bearing routes used to unmount one and mount
 * the other, which destroys the WebGLRenderer and its context. The parsed GLB
 * survives in the module-scope caches (hooks/use-glb-loader.js, drei's
 * useGLTF), but compiled shader programs, uploaded textures and the PMREM
 * target live in the CONTEXT — so every switch re-linked every program and
 * re-uploaded every texture, which is the multi-second gl.compile() the loading
 * overlay was covering.
 *
 * The fix is that `visited` below only ever grows. A key enters on its first
 * activation and is never removed, so its <Canvas> stays mounted for the rest
 * of the session. Removing a key here would destroy the context again and undo
 * the entire feature.
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

  // Activation timing.
  //
  // performance.mark/measure rather than a logger-only readout: logger.info is
  // gated on import.meta.env.DEV (utils/logger.js) and is stripped from staging
  // and production builds — the exact builds whose switching cost is in
  // question. User Timing entries show up in the DevTools Performance timeline
  // in every build mode. The logger line below is the convenience readout for
  // dev.
  //
  // Double rAF: the first fires before the browser paints the newly activated
  // view, the second after — so the measure spans "route changed" to "the user
  // can see it". Target: under ~100ms for a previously-visited route.
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

    // `activeKey` is unioned in explicitly rather than waited for: the effect
    // above lands one commit later, and the route the user just navigated to
    // has to render on THIS one.
    //
    // With the flag off, only the active key renders — i.e. exactly the
    // unmount-on-navigate behaviour that shipped before this feature, on the
    // same code path rather than a forked one.
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
