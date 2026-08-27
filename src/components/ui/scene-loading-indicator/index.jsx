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
 *
 * `offset` (from containers/scene-canvas's own hook) shifts this off the
 * raw canvas box's center toward the middle of what's actually visible: the
 * canvas is always full-bleed (see containers/scene-canvas/use-scene-canvas
 * .js's own canvasHeight comment), so on desktop the Inventory sidebar and,
 * on mobile, the bottom sheet are opaque overlays painted OVER part of it,
 * not reductions of its size — centering on `inset-0` alone would put this
 * partly or fully underneath one of those overlays instead of in the
 * middle of the visible canvas region.
 */
export const SceneLoadingIndicator = ({ visible, offset = { x: 0, y: 0 } }) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label={t("loading", "Loading")}
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div className="animate-in flex h-16 w-16 items-center justify-center rounded-full bg-background/70 shadow-[0_8px_30px_rgba(0,0,0,0.55)] ring-1 ring-foreground/10 backdrop-blur-md duration-300 fade-in-0 zoom-in-95">
        <Spinner className="size-8 text-foreground" />
      </div>
    </div>
  );
};

export default SceneLoadingIndicator;
