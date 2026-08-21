import React, { useCallback } from "react";
import { logger } from "@/utils/logger";

/**
 * HeroSlide — One aerial still in the loader cross-dissolve.
 *
 * Sits in a stacked composite:
 * - Slide 0 (Day) is the permanent base layer at opacity: 1 (zIndex: 1).
 * - Slide 1 (Night) is the animated overlay at zIndex: 2 with hero-night-crossfade.
 *
 * This provides a 100% continuous, silky-smooth blend with zero flicker and zero black gap.
 */
export const HeroSlide = ({
  image,
  webp,
  webpMobile,
  animation,
  zIndex = 1,
  opacity = 1,
  isFirst = false,
}) => {
  const handleError = useCallback(() => {
    logger.error("[HeroSlide] Failed to load hero still", image);
  }, [image]);

  return (
    <div
      data-slot="hero-slide"
      className="absolute inset-0"
      style={{
        zIndex,
        animation: animation || "none",
        opacity,
        willChange: animation ? "opacity" : "auto",
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden",
      }}
      aria-hidden="true"
    >
      {/* WebP first (smaller at equal visual quality — see utils/constant.js's
          HOME_LOADER_SLIDES comment for measured sizes), mobile-width variant
          before the full-size one so a phone on a slow connection never
          fetches the desktop file. Same 1024px breakpoint the GLB preloads in
          index.html already use, for one shared definition of "mobile" across
          every asset this loader touches. Browsers without WebP support (or
          missing this markup entirely, e.g. the pre-JS static splash in
          index.html) fall through to the <img> JPEG below untouched. */}
      <picture>
        {webpMobile && (
          <source
            srcSet={webpMobile}
            type="image/webp"
            media="(max-width: 1023px)"
          />
        )}
        {webp && <source srcSet={webp} type="image/webp" />}
        <img
          data-slot="hero-slide-image"
          src={image}
          alt=""
          width={2500}
          height={1375}
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority={isFirst ? "high" : "low"}
          onError={handleError}
          className="h-full w-full select-none object-cover object-center [-webkit-touch-callout:none]"
        />
      </picture>
    </div>
  );
};

export default HeroSlide;
