import React, { memo } from "react";
import { ICONS } from "@/assets/icons";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/**
 * HomeBrandPill - Pure UI component displaying the gold Home icon and 88 Residences brand logo.
 * Follows SOP Three-Layer Architecture: pure presentational component driven by props.
 */
export const HomeBrandPill = memo(function HomeBrandPill({
  redirectUrl = "https://www.88residences.com/",
  onClick,
  className,
}) {
  return (
    <a
      href={redirectUrl}
      target="_top"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          onClick(e);
        } else {
          try {
            if (window.top && window.top !== window) {
              window.top.location.href = redirectUrl;
              return;
            }
          } catch {
            // Ignore cross-origin iframe security error
          }
          window.location.href = redirectUrl;
        }
      }}
      onMouseDown={(e) => {
        // Prevent GTM linker from intercepting mousedown to decorate href with _gl params
        e.stopPropagation();
      }}
      dir="ltr"
      aria-label="88 Residences Home"
      className={cn(
        "group absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-10 lg:left-10 z-20 pointer-events-auto",
        "flex items-center gap-2.5 sm:gap-3 lg:gap-3.5",
        "h-[44px] sm:h-[48px] lg:h-[54px]",
        "px-3.5 sm:px-4.5 lg:px-5",
        "bg-black/35 backdrop-blur-[2px] border border-white/10 rounded-lg shadow-md",
        "hover:bg-white hover:border-border-light hover:shadow-xl",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow focus-visible:ring-offset-2",
        "cursor-pointer select-none no-underline",
        className,
      )}
    >
      {/* Brand-matched Gold Home Icon */}
      <div className="flex items-center justify-center shrink-0">
        <ICONS.Home
          strokeWidth={2}
          className="size-5 sm:size-5.5 lg:size-6 text-accent-yellow transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Subtle Vertical Divider */}
      <div
        className="h-3.5 sm:h-4 lg:h-4.5 w-px bg-white/20 group-hover:bg-gray-300 transition-colors shrink-0"
        aria-hidden="true"
      />

      {/* 88 Residences Logo */}
      <div className="flex items-center justify-center shrink-0">
        <img
          src={logo}
          alt="88 Residences"
          className="h-5 sm:h-5.5 lg:h-6.5 w-auto object-contain pointer-events-none transition-transform duration-200"
          loading="eager"
          fetchPriority="high"
        />
      </div>
    </a>
  );
});

export default HomeBrandPill;
