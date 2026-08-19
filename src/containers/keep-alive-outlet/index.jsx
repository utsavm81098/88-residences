import { Outlet } from "react-router";
import useKeepAliveOutlet from "./use-keep-alive-outlet";

/**
 * KeepAliveOutlet — replaces <Outlet /> for the 3D routes.
 *
 * Renders every keep-alive route visited so far, stacked absolutely, with only
 * the active one visible. See use-keep-alive-outlet.js for why the inactive
 * ones must stay mounted.
 */
export const KeepAliveOutlet = () => {
  const {
    data: { views },
  } = useKeepAliveOutlet();

  // No keep-alive route matched — a future non-3D page, or a `handle` typo.
  // Falling through to a conventional Outlet degrades to normal routing
  // instead of a blank screen.
  if (views.length === 0) return <Outlet />;

  return (
    <div className="relative h-full w-full">
      {views.map(({ key, Component, isActive }) => (
        <div
          key={key}
          className="absolute inset-0"
          // visibility, NOT display:none. display:none collapses the box to
          // 0x0, which drives R3F's ResizeObserver to resize the renderer to
          // zero and makes the inventory EffectComposer allocate a zero-sized
          // render target. visibility keeps the layout box intact and skips
          // paint — and because it inherits, the fixed-position HomeLoader
          // (containers/home/home-loader.jsx, `fixed inset-0 z-[150]`) inside a
          // hidden view is hidden along with it rather than covering the
          // visible route.
          style={{ visibility: isActive ? "visible" : "hidden" }}
          // React 19 treats `inert` as a real boolean attribute. The hidden
          // view still contains focusable controls (TopNavigation's buttons,
          // SidebarPanel), so without this they stay tabbable and visible to
          // screen readers.
          inert={!isActive}
          aria-hidden={!isActive}
        >
          <Component active={isActive} />
        </div>
      ))}
    </div>
  );
};

export default KeepAliveOutlet;
