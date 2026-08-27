import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";

/**
 * SceneLoadingIndicator - small, non-blocking overlay shown while a 3D
 * asset already inside the live scene is still streaming in (e.g. a
 * newly-selected building's GLB on a slow mobile connection).
 *
 * Purely cosmetic, never gates interaction: it exists because every
 * Suspense boundary around the 3D content (containers/scene-canvas,
 * features/building) intentionally renders `fallback={null}` — correct for
 * the 3D scene graph itself (see features/building/index.jsx's NullFallback
 * comment: a DOM-shaped fallback can't render inside <Canvas>) but it means
 * the canvas gave no visual feedback at all while a several-MB GLB
 * downloaded, which read as the page being frozen rather than loading.
 * This renders as a DOM sibling of the Canvas instead, so it isn't subject
 * to that constraint.
 */
export const SceneLoadingIndicator = ({ visible }) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label={t("loading", "Loading")}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 shadow-lg backdrop-blur-sm">
        <Spinner className="size-5 text-foreground" />
      </div>
    </div>
  );
};

export default SceneLoadingIndicator;
