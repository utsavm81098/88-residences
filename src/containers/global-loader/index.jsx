import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroCarousel from "@/components/ui/hero-carousel";
import { HOME_LOADER_SLIDES } from "@/utils/constant";
import { cn } from "@/lib/utils";
import useGlobalLoader from "./use-global-loader";

/**
 * GlobalLoader — the one loading screen the user sees exactly once per
 * session, mounted at the app root (see app.jsx) above the router so it
 * covers whichever route — Home or Inventory — the user actually lands on
 * first, rather than each route only knowing how to gate its own reveal.
 *
 * REAL BUG THIS FIXES: containers/home/home-loader.jsx and
 * containers/canvas-loader/index.jsx were each already correct in isolation
 * (they don't reveal their OWN route until its GLB has truly finished
 * loading — see features/scene-ready-gate), but a direct link straight to
 * Inventory never mounts Home's loader at all, and — more importantly for
 * what was actually reported — the app's OWN chrome (layouts/main-layout's
 * sidebar rail, whichever route's top-level container) still renders and
 * paints the instant React commits, underneath whichever per-route loader
 * happens to be active. On a slow first load that could be seen flashing in
 * for a frame before that route's own loader had a chance to cover it. This
 * component removes that gap entirely: nothing below app.jsx's
 * <RouterProvider> is visible until Redux's one-way
 * appLoader.initialLoadComplete latch (store/slices/app-loader-slice.js)
 * flips true — fed by whichever of Home's or Inventory's own SceneReadyGate
 * fires first — and it never reappears afterward even though this component
 * itself never unmounts, because that latch never resets.
 *
 * Reuses the exact same HOME_LOADER_SLIDES/HeroCarousel index.html's own
 * static, CSS-only boot splash renders (see that file) so there is no visible
 * seam the instant React's createRoot().render() replaces it: same imagery,
 * same crossfade, just now driven by a real "is anything actually ready yet"
 * signal instead of disappearing unconditionally on first paint.
 *
 * No re-arm logic (contrast containers/home/home-loader.jsx's isReady->false
 * recovery handling): appLoader.initialLoadComplete has no reducer that ever
 * sets it back to false, by design — a WebGL context loss mid-session is
 * each route's own HomeLoader/CanvasLoader's job to recover from, not a
 * reason to re-show the very-first-load splash again.
 */
export const GlobalLoader = () => {
  const { t } = useTranslation();
  const { isReady } = useGlobalLoader();
  const [unmounted, setUnmounted] = useState(false);

  const handleTransitionEnd = useCallback(
    (event) => {
      // React's onTransitionEnd is delegated, so it also catches events
      // bubbling up from descendants (HeroCarousel's own crossfade). Only
      // this element's own opacity fade should unmount it.
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== "opacity") return;
      if (isReady) setUnmounted(true);
    },
    [isReady],
  );

  if (unmounted && isReady) return null;

  return (
    <div
      role="status"
      aria-label={t("loading", "Loading")}
      aria-hidden={isReady}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        // z-[200]: above every per-route loader (Home/Inventory both use
        // z-[150]) so this is the true outermost layer while active, and
        // still below the z-[1000]+ dialog/sheet/tooltip band.
        "fixed inset-0 z-[200] transition-opacity duration-700 ease-in-out",
        isReady
          ? "pointer-events-none opacity-0"
          : "pointer-events-auto opacity-100",
      )}
    >
      <HeroCarousel slides={HOME_LOADER_SLIDES} />
    </div>
  );
};

export default GlobalLoader;
