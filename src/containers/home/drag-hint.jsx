import { Hand, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * DragHint — one-time-per-page-load overlay teaching the user the home scene
 * is interactive/rotatable, shown before (and remaining through) the first
 * auto-rotate — dismissed only by an actual interaction, never by
 * auto-rotate starting on its own.
 *
 * Deliberately a plain DOM overlay OUTSIDE the Canvas (same architectural
 * category as HomeLoader — see that file's comment) rather than a drei
 * <Html> anchored to a 3D point: it needs to read as fixed screen UI, not a
 * label on the model, and must never touch the R3F scene graph.
 *
 * Visibility is driven entirely by CameraRig's idle timers (via
 * use-auto-rotate-hint.js) through onHintVisibleChange -> useHome's
 * showAutoRotateHint, threaded down through HomeScene exactly like
 * onReady/isReady already are. This component owns no timers of its own —
 * it only renders what it's told.
 *
 * A single hand icon sweeping left/right, flanked by two static chevrons for
 * the directional cue — built from existing lucide-react icons (Hand,
 * ChevronLeft/Right) rather than a hand-authored custom SVG: far less
 * error-prone than drawing bespoke path data, and free consistency with
 * this app's existing icon-sizing/stroke conventions. All in the brand's
 * text-accent-yellow. A drop-shadow (same idiom as the building-marker pins
 * in src/features/building-markers/index.jsx, which are also bare icons
 * directly over the 3D scene with no backing plate) keeps it legible against
 * whatever's behind it without needing a solid badge.
 *
 * Always mounted (never conditionally rendered) so hiding plays the
 * fade/slide transition instead of the element vanishing outright, matching
 * HomeLoader's own opacity-toggle idiom. pointer-events-none is
 * unconditional, not tied to `visible` — this overlay sits right where a
 * drag gesture would start, and must never be able to intercept one.
 */
export const DragHint = ({ visible = false }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-10 z-40 flex justify-center transition-all duration-500 ease-out sm:bottom-14 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3">
        <ChevronLeft
          className={`h-5 w-5 text-accent-yellow sm:h-6 sm:w-6 ${visible ? "animate-pulse" : ""}`}
        />
        <Hand
          className={`h-14 w-14 text-accent-yellow drop-shadow-[0_3px_6px_rgba(0,0,0,0.45)] sm:h-16 sm:w-16 ${
            visible ? "animate-drag-hint" : ""
          }`}
          strokeWidth={1.75}
        />
        <ChevronRight
          className={`h-5 w-5 text-accent-yellow sm:h-6 sm:w-6 ${visible ? "animate-pulse" : ""}`}
        />
      </div>
    </div>
  );
};

export default DragHint;
