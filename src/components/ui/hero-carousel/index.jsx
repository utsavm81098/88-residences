import React from "react";
import HeroSlide from "./hero-slide";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

// Loader crossfade parameters:
// - Day aerial image sits permanently solid (opacity 1) at zIndex 1.
// - Night aerial image cross-fades smoothly in and out on top with a silky-smooth
//   cubic-bezier(0.45, 0.05, 0.55, 0.95) easing curve.
// - GPU-composited CSS animation: runs at 60/120fps with zero JS thread blocking.
const ANIMATION_RULE =
  "hero-night-crossfade 6000ms cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite";

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
  const baseSlide = slides[0]; // Day (PLOT88-birdeye-day.jpg)
  const overlaySlide = slides[1]; // Night (PLOT88-birdeye-night.jpg)

  return (
    <div
      dir="ltr"
      className={cn(
        "relative h-full w-full select-none overflow-hidden bg-background [touch-action:pinch-zoom]",
        className
      )}
    >
      {/* ── Base Layer (Day) — Solid Opacity at zIndex 1 ── */}
      {baseSlide && (
        <HeroSlide
          key={baseSlide.id || "day"}
          image={baseSlide.image}
          webp={baseSlide.webp}
          webpMobile={baseSlide.webpMobile}
          zIndex={1}
          opacity={1}
          isFirst={true}
        />
      )}

      {/* ── Overlay Layer (Night) — Smooth ease-in-out Crossfade at zIndex 2 ── */}
      {overlaySlide && (
        <HeroSlide
          key={overlaySlide.id || "night"}
          image={overlaySlide.image}
          webp={overlaySlide.webp}
          webpMobile={overlaySlide.webpMobile}
          zIndex={2}
          animation={ANIMATION_RULE}
          isFirst={false}
        />
      )}

      {/* ── Center-Screen Rotating 88 Logo ── */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          data-slot="hero-logo"
          className="animate-rotate-logo flex h-[60px] w-[60px] items-center justify-center drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:h-[60px] sm:w-[60px] md:h-[90px] md:w-[90px]"
        >
          <Logo />
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;

