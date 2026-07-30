import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";

/**
 * DOM-level loading overlay for the home scene.
 *
 * Deliberately NOT the shared CanvasLoader: that one renders inside drei's
 * <Html>, so it only appears once WebGL has initialised and the canvas would
 * show as opaque black until then. The model is tens of megabytes, so that gap
 * is long enough to look broken. useProgress reads a global store fed by
 * THREE.DefaultLoadingManager and works fine outside the Canvas.
 *
 * Dismissal is driven by `isReady` from SceneReadyGate, NOT by progress hitting
 * 100%. Bytes arriving is not the same as being able to draw: shaders still have
 * to compile and 321 textures still have to reach the GPU. Hiding at 100% is
 * what let the user watch the scene assemble.
 */
export const HomeLoader = ({ isReady = false }) => {
  const { progress } = useProgress();
  const { t, i18n } = useTranslation();
  const isComplete = isReady;

  // Once bytes are in we are compiling shaders and uploading textures, which
  // useProgress cannot see — hold at 99% rather than sitting at a finished-
  // looking 100% while there is still work to do.
  const raw = Math.round(progress);
  const displayProgress = isReady ? 100 : Math.max(4, Math.min(99, raw));

  return (
    <div
      aria-hidden={isComplete}
      className={`absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-700 ${
        isComplete ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-yellow/5 blur-[120px]" />

      <div
        dir={i18n.dir()}
        className="relative z-10 flex min-w-[240px] flex-col items-center justify-center rounded-2xl border border-border/50 bg-background/95 p-6 text-center shadow-2xl"
      >
        <span className="mb-3 font-open-sans text-[10px] uppercase tracking-widest text-white/40">
          {t("loading_model", "Loading Model")}
        </span>
        {/* dir="ltr" so the bar always fills left-to-right, including in Hebrew */}
        <i
          dir="ltr"
          className="mb-2 flex h-[3px] w-full justify-start overflow-hidden rounded-full bg-white/15"
        >
          <b
            className="block h-full bg-accent-yellow transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </i>
        <em
          dir="ltr"
          className="font-open-sans text-xs font-semibold not-italic text-accent-yellow"
        >
          {displayProgress}%
        </em>
      </div>
    </div>
  );
};

export default HomeLoader;
