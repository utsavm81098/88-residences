import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * DOM-level loading overlay for the home scene.
 */
export const HomeLoader = ({ isReady = false, progress = 0 }) => {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setMounted(false), 750);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (!mounted) return null;

  const raw = Math.round(progress);
  const displayProgress = isReady ? 100 : Math.max(4, Math.min(99, raw));

  return (
    <div
      aria-hidden={isReady}
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-700",
        isReady ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
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
