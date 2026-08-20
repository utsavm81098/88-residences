import React, { useState, useEffect } from "react";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ENV_CONFIG } from "@/utils/env-config";

/**
 * drei's `useProgress` is a global zustand store shared by every loader in the
 * app, and it is NOT reset between mounts. On any mount that happens after a
 * load has already finished it already reads `progress: 100, active: false`.
 *
 * Reading it here — synchronously, for the `useState` initialiser — instead of
 * in a post-paint `useEffect` avoids rendering the overlay at `opacity-100` for
 * one frame before discovering there was nothing to load, which produced a
 * visible 700ms fade of a "100%" card followed by a 750ms unmount timer.
 *
 * CRITICAL: this seeding is only correct when this component can REMOUNT.
 * Under keep-alive (containers/keep-alive-outlet) the inventory view mounts
 * exactly once per session, and that single mount is the genuine first load —
 * precisely when the loader must appear. Seeding from the global store there
 * would suppress it permanently, because Home's own environment textures and
 * the idle preloadModels() call have already driven that shared store to
 * `progress: 100, active: false` long before the user ever opens Inventory.
 * The result would be a blank canvas with no feedback while the building GLB
 * downloads, unrecoverable for the rest of the session.
 *
 * So: keep-alive ON → always start visible and let useProgress drive the
 * fade-out. Keep-alive OFF → the component remounts on every navigation, the
 * one-frame flash is real, and this seeding is the fix for it.
 *
 * REAL BUG FIXED HERE: this component used to hide the instant `useProgress`
 * hit 100%/inactive — which only means the GLB's bytes finished downloading
 * and parsing, not that its shaders have actually finished compiling or its
 * textures have actually reached the GPU (see features/scene-ready-gate's own
 * doc comment — Home's HomeLoader was already built around this distinction;
 * this loader wasn't). That let the Inventory page — sidebar, building
 * nav, canvas — become visible and interactive while the building model was
 * still mid-compile, the same class of "page shows before the model is
 * actually ready" bug already fixed for Home. `sceneReady` (from
 * features/scene-ready-gate via containers/inventory/use-inventory.js's
 * onReady) is now required in addition to the byte-progress signal below
 * before this ever hides — and the overlay itself is now a full-viewport
 * `fixed inset-0`, matching containers/home/home-loader.jsx, instead of being
 * scoped to just the canvas area, so it actually covers the sidebar/top
 * navigation too rather than letting them render underneath it.
 */
const readInitialProgress = () => {
  if (ENV_CONFIG.KEEP_ALIVE_ROUTES) {
    return { progress: 0, isComplete: false };
  }

  try {
    const state = useProgress.getState();
    const progress = state?.progress ?? 0;
    return { progress, isComplete: progress >= 100 && !state?.active };
  } catch {
    // Defensive: matches the existing try/catch around the same call.
    return { progress: 0, isComplete: false };
  }
};

export const CanvasLoader = ({ sceneReady = false }) => {
  const { t, i18n } = useTranslation();
  const [initial] = useState(readInitialProgress);
  const [progress, setProgress] = useState(initial.progress);
  // Renamed from the old `isReady` to `bytesReady`: this is only ever the
  // useProgress (download/parse) signal now — see the module comment above
  // for why that alone is no longer sufficient to hide the overlay.
  const [bytesReady, setBytesReady] = useState(initial.isComplete);
  // Already complete at first render → never mount the overlay at all, so
  // there is no frame at opacity-100 to fade out. sceneReady is always false
  // on a genuine fresh mount (containers/inventory/use-inventory.js's isReady
  // starts at false every time), so this fast path only actually applies on
  // the keep-alive-off/remount case readInitialProgress already documents.
  const [mounted, setMounted] = useState(!(initial.isComplete && sceneReady));

  useEffect(() => {
    try {
      const currentState = useProgress.getState();
      if (!currentState?.active || (currentState?.progress ?? 0) >= 100) {
        setBytesReady(true);
      }
    } catch {}

    let rafId = null;
    const unsubscribe = useProgress.subscribe((state) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const p = state.progress;
        setProgress(p);
        if (p >= 100 || !state.active) {
          setBytesReady(true);
        }
      });
    });

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Truly done only once the bytes have downloaded/parsed AND the scene has
  // actually finished compiling on the GPU — see the module comment above.
  // (containers/global-loader's session-wide latch is fed from
  // containers/inventory/use-inventory.js's own handleReady, not from here —
  // this component only owns the byte-progress readout.)
  const isDone = bytesReady && sceneReady;

  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isDone]);

  if (!mounted) return null;

  const raw = Math.round(progress);
  const displayProgress = isDone ? 100 : Math.max(8, Math.min(99, raw));

  return (
    <div
      aria-hidden={isDone}
      className={cn(
        // fixed inset-0, not absolute inset-0 scoped to the canvas area:
        // matches containers/home/home-loader.jsx so the overlay covers the
        // WHOLE page (sidebar, top navigation, canvas) while not ready, not
        // just the 3D viewport. z-[150] matches Home's loader exactly — see
        // its own comment for why that clears the app's nav rails while
        // staying below the z-[1000]+ dialog/sheet/tooltip band.
        "fixed inset-0 z-[150] flex items-center justify-center bg-background transition-opacity duration-300",
        isDone ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-yellow/5 blur-[120px]" />

      <div
        dir={i18n.dir()}
        className="relative z-10 flex min-w-[240px] flex-col items-center justify-center rounded-2xl border border-border/50 bg-background/95 p-6 text-center shadow-2xl"
      >
        <span className="mb-3 font-open-sans text-[10px] uppercase tracking-widest text-white/40">
          {t("loading_model", "Loading Model")}
        </span>
        {/* dir="ltr" so the bar always fills left-to-right, including in Hebrew */}
        <i
          dir="ltr"
          className="mb-2 flex h-[3px] w-full justify-start overflow-hidden rounded-full bg-white/15"
        >
          <b
            className="block h-full bg-accent-yellow transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </i>
        <em
          dir="ltr"
          className="font-open-sans text-xs font-semibold not-italic text-accent-yellow"
        >
          {displayProgress}%
        </em>
      </div>
    </div>
  );
};

export default CanvasLoader;
