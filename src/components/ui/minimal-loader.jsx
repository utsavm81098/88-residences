import React from "react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/**
 * MinimalLoader — a small, on-brand loading indicator with none of
 * components/ui/hero-carousel's overhead (no day/night stills, no crossfade
 * animation, nothing but a single small SVG and a CSS rotation).
 *
 * Exists for reveals that are NOT the app's first-ever load — see
 * containers/home/home-loader.jsx's light variant for the reveal this was
 * built for. A repeat reveal is measured in ~1-2s (the time to re-link
 * shaders and re-upload already-cached textures to a fresh WebGL context —
 * see that file's own doc comment for why that time can't go to zero without
 * reopening a confirmed crash). A plain, featureless background for that
 * whole window reads as a frozen/broken screen, not a brief pause; the full
 * branded carousel reads as a second loading screen for something that
 * isn't a genuine cold load. This is the middle ground: visible proof
 * something is happening, without either extreme.
 */
export const MinimalLoader = ({ className }) => (
  <div
    className={cn(
      "flex h-full w-full items-center justify-center bg-background",
      className,
    )}
  >
    <div className="h-[40px] w-[40px] animate-rotating drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
      <Logo />
    </div>
  </div>
);

export default MinimalLoader;
