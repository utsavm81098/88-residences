import swipeGif from "@/assets/images/swipe.gif";

/**
 * HandGestureHint — bottom-center overlay teaching the user the scene
 * is interactive/rotatable, shown during idle stretches (see
 * src/features/home-scene/use-auto-rotate-hint.js for the timing sequence).
 *
 * Renders the animated two-finger drag-to-rotate gesture with horizontal
 * indicator arrows matching the reference application, instructing the user
 * that the 3D model can be rotated via touch or mouse drag.
 */
export const HandGestureHint = ({ visible = false }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-24 z-30 flex justify-center transition-all duration-500 ease-out sm:bottom-28 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="relative flex flex-col items-center select-none">
        <img
          src={swipeGif}
          alt=""
          className="h-32 w-32 object-contain select-none sm:h-40 sm:w-40"
          style={{
            filter:
              "brightness(1.15) drop-shadow(0 0 2px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.8)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6))",
            transform: "translateZ(0)",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default HandGestureHint;
