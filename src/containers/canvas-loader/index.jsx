import React from "react";
import { Html, useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";

/**
 * CanvasLoader Container.
 * Renders a premium, dynamic loading overlay inside the 3D Canvas
 * powered by the useProgress hook from react-three/drei.
 */
export const CanvasLoader = () => {
  const { progress } = useProgress();
  const { t, i18n } = useTranslation();
  
  // Ensure visual indication starts at least at 8% and caps at 100%
  const displayProgress = Math.max(8, Math.min(100, Math.round(progress)));
  const dir = i18n.dir();

  return (
    <Html fullscreen className="model-loader z-50">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          dir={dir}
          className="flex flex-col items-center justify-center p-6 bg-background/95 border border-border/50 rounded-2xl min-w-[220px] text-center shadow-2xl pointer-events-auto"
        >
          <span className="text-[10px] text-white/40 font-open-sans uppercase tracking-widest mb-3">
            {t("loading_model", "Loading Model")}
          </span>
          <i dir="ltr" className="w-full bg-white/15 h-[3px] rounded-full overflow-hidden flex mb-2 justify-start">
            <b
              className="h-full block transition-all duration-300 ease-out bg-accent-yellow"
              style={{
                width: `${displayProgress}%`,
              }}
            />
          </i>
          <em className="text-xs font-semibold text-accent-yellow font-open-sans not-italic" dir="ltr">
            {displayProgress}%
          </em>
        </div>
      </div>
    </Html>
  );
};

export default CanvasLoader;

