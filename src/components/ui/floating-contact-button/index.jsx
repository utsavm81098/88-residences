import React, { memo } from "react";
import { ICONS } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FloatingContactButton - Pure UI circular floating button with gold email icon.
 * Follows SOP Three-Layer Architecture: pure presentational component driven by props.
 */
export const FloatingContactButton = memo(function FloatingContactButton({
  onClick,
  className,
}) {
  return (
    <Button
      variant="ghost"
      size="icon-xl"
      onClick={onClick}
      aria-label="Contact Us"
      className={cn(
        "group absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10 z-20 pointer-events-auto",
        "size-[44px] sm:size-[48px] lg:size-[54px]",
        "bg-white border border-border-light rounded-full text-accent-yellow shadow-xl hover:shadow-2xl",
        "hover:!bg-gray-50 active:!bg-gray-100 hover:scale-105 active:scale-95",
        "transition-all duration-200 ease-out cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow focus-visible:ring-offset-2",
        className,
      )}
    >
      <ICONS.Mail
        strokeWidth={1.8}
        className="size-[22px] sm:size-[25px] lg:size-[28px] text-accent-yellow transition-transform duration-200 group-hover:scale-105"
      />
    </Button>
  );
});

export default FloatingContactButton;
