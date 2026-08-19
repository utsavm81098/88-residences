import HomePage from "@/pages/home";
import InventoryPage from "@/pages/inventory";

/**
 * Registry mapping a route's `handle.keepAlive` key to the component that
 * renders it. Kept separate from the hook and the JSX so adding a future
 * keep-alive route touches exactly this object literal.
 *
 * Every component here MUST accept an `active: boolean` prop — see
 * containers/keep-alive-outlet/index.jsx, which renders inactive views mounted
 * but hidden, and relies on the component to stop its own render loop.
 */
export const KEEP_ALIVE_VIEWS = {
  home: HomePage,
  inventory: InventoryPage,
};

export default KEEP_ALIVE_VIEWS;
