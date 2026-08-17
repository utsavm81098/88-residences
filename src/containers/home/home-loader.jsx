import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import HeroCarousel from "@/components/ui/hero-carousel";
import { HOME_LOADER_SLIDES } from "@/utils/constant";
import { cn } from "@/lib/utils";

/**
 * HomeLoader - Full-screen background carousel loader for the Home Page.
 * Displays day and night aerial imagery while the 3D GLB model downloads, parses
 * and its shaders compile, then fades out to reveal the 3D Masterplan scene the
 * moment isReady is true.
 *
 * `isReady` is the right signal to reveal on: it comes from
 * features/home-scene/scene-ready-gate.jsx, which fires only after the bytes have
 * downloaded, the GLB has parsed, gl.compile() has finished and one frame has
 * elapsed. There is no byte-progress readout by design — the imagery is the feedback.
 *
 * There are deliberately NO timers in this component. It never delays the reveal by
 * even a frame: the fade starts the instant isReady flips, and the overlay unmounts
 * on the fade's own `transitionend` rather than on a setTimeout guessed to match
 * duration-700. A timer here would (a) hold the 3D scene behind an already-finished
 * loader and (b) silently desync the moment anyone edited the duration class.
 *
 * Trade-off worth knowing: the carousel's first crossfade happens 2s in (see
 * components/ui/hero-carousel). When the GLB resolves faster than that — a repeat
 * navigation, HMR, or a warm HTTP cache, where it can resolve in well under a second
 * from the module-scope cache in hooks/use-glb-loader.js — the loader is gone before
 * the crossfade starts, so only the day still is seen. That is the intended
 * behaviour: never make the user wait on the loader.
 */
export const HomeLoader = ({ isReady = false }) => {
  const { t } = useTranslation();
  const [unmounted, setUnmounted] = useState(false);

  const handleTransitionEnd = useCallback(
    (event) => {
      // React's onTransitionEnd is delegated, so it also catches events bubbling up
      // from descendants. Only this element's own opacity fade should unmount it.
      if (event.target !== event.currentTarget) return;
      if (event.propertyName !== "opacity") return;
      if (isReady) setUnmounted(true);
    },
    [isReady],
  );

  if (unmounted) return null;

  return (
    <div
      // role/aria-label rather than descriptive alt text on the images: while
      // loading, the two renders are decorative, so a screen reader should hear
      // "Loading" once instead of narrating both. The `loading` key already exists
      // in the en and he bundles.
      role="status"
      aria-label={t("loading", "Loading")}
      aria-hidden={isReady}
      onTransitionEnd={handleTransitionEnd}
      className={cn(
        // `fixed inset-0` deliberately, with no h-full/w-full and no 100vh:
        // inset-0 already pins all four edges, and it sidesteps the iOS
        // address-bar 100vh bug that the reference site actually has.
        //
        // z-[150] clears the nav rails in layouts/main-layout (z-[110] desktop,
        // z-[120] mobile — currently commented out, but they will return) while
        // staying well below the dialog/sheet/tooltip band at z-[1000]+.
        "fixed inset-0 z-[150] transition-opacity duration-700 ease-in-out",
        isReady
          ? "pointer-events-none opacity-0"
          : "pointer-events-auto opacity-100",
      )}
    >
      <HeroCarousel slides={HOME_LOADER_SLIDES} />
    </div>
  );
};

export default HomeLoader;
