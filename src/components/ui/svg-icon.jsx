import React from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

/**
 * A reusable component to render raw SVG string data safely.
 * @param {string} svgdata - The raw SVG string content.
 * @param {string} className - Optional Tailwind CSS classes for sizing and styling.
 */
export const SvgIcon = ({ svgdata, className }) => {
  if (!svgdata) return null;

  // Sanitize SVG to prevent XSS injection (SOP §16 security compliance)
  const cleanSvg = DOMPurify.sanitize(svgdata, {
    USE_PROFILES: { html: false, svg: true },
  });

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: cleanSvg }}
    />
  );
};
