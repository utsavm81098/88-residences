import React from "react";
import HeroSlide from "./hero-slide";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

// Loader crossfade parameters:
// - Day aerial image sits permanently solid (opacity 1) at the base.
// - Night aerial image cross-fades smoothly in and out on top with a silky-smooth
//   cubic-bezier(0.45, 0.05, 0.55, 0.95) easing curve over 1800ms.
// - 3200ms hold on pure Day, 3200ms hold on pure Night, 1800ms per transition = 10000ms total loop.
// - GPU-composited CSS animation: runs at 60/120fps with zero JS thread blocking.
const ANIMATION_RULE =
  "hero-night-crossfade 10000ms cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite";

/**
 * HeroCarousel — Full-screen ultra-smooth infinite crossfade loader.
 *
 * Employs a zero-flicker composite:
 * 1. Base slide (Day) is solid at zIndex 1.
 * 2. Overlay slide (Night) dissolves in and out at zIndex 2.
 * At every millisecond, (Night*α + Day*(1-α)) = 1.0, giving an uninterrupted,
 * perfectly smooth transition without any darkness dip or blinking.
 */
export const HeroCarousel = ({ slides = [], className }) => {
  const baseSlide = slides[0];
  const overlaySlide = slides[1];

  return (
    <div
      dir="ltr"
      className={cn(
        "relative h-full w-full select-none overflow-hidden bg-background [touch-action:pinch-zoom]",
        className,
      )}
    >
      {/* ── Base Layer (Day) — Solid Opacity ── */}
      {baseSlide && (
        <HeroSlide
          key={baseSlide.id || "day"}
          image={baseSlide.image}
          zIndex={1}
          opacity={1}
          isFirst={true}
        />
      )}

      {/* ── Overlay Layer (Night) — Smooth ease-in-out Crossfade ── */}
      {overlaySlide && (
        <HeroSlide
          key={overlaySlide.id || "night"}
          image={overlaySlide.image}
          zIndex={2}
          animation={ANIMATION_RULE}
          isFirst={false}
        />
      )}

      {/* ── Center-Screen Rotating 88 Logo (Enlarged size) ── */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          data-slot="hero-logo"
          className="flex h-[60px] w-[60px] items-center justify-center animate-rotating drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:h-[60px] sm:w-[60px] md:h-[90px] md:w-[90px]"
        >
          <Logo />
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
