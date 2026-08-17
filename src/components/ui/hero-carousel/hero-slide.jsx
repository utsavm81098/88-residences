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
    </div>
  );
};

export default HeroSlide;
