import React from "react";
import { cn } from "@/lib/utils";

/**
 * A reusable component to render raw SVG string data safely.
 * @param {string} svgdata - The raw SVG string content.
 * @param {string} className - Optional Tailwind CSS classes for sizing and styling.
 */
export const SvgIcon = ({ svgdata, className }) => {
  if (!svgdata) return null;

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: svgdata }}
    />
  );
};
