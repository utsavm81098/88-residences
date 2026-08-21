import { lazy } from "react";
import HomePage from "@/pages/home";

/**
 * Registry mapping a route's `handle.keepAlive` key to the component that
 * renders it. Kept separate from the hook and the JSX so adding a future
 * keep-alive route touches exactly this object literal.
 *
 * Every component here MUST accept an `active: boolean` prop — see
 * containers/keep-alive-outlet/index.jsx, which renders inactive views mounted
 * but hidden, and relies on the component to stop its own render loop.
 *
 * InventoryPage is lazy: without a dynamic import() boundary anywhere in this
 * chain, EVERY Inventory 2D UI component — sidebar-panel, mobile-menu (which
 * itself pulls in embla-carousel), filter-overlay, enquiry-dialog,
 * unit-info-card — was bundled into the SAME initial chunk main.jsx boots,
 * parsed and evaluated (module-level GSAP registrations included) even for a
 * visitor who lands on Home and never opens Inventory. Reported as "heavy
 * load ... at initial root of React.js." HomePage stays eager: it's the
 * default landing, so lazy-loading it wouldn't reduce initial work for the
 * common case, only add a chunk fetch to it. The <Suspense> this needs lives
 * in containers/keep-alive-outlet/index.jsx.
 */
export const KEEP_ALIVE_VIEWS = {
  home: HomePage,
  inventory: lazy(() => import("@/pages/inventory")),
};

export default KEEP_ALIVE_VIEWS;
