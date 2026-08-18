import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router";
import { fetchInventory } from "@/store/slices/building-slice";
import SidebarNavContainer from "@/containers/sidebar-nav";
import MobileNavContainer from "@/containers/mobile-nav";
import { SIDEBAR_WIDTH } from "@/utils/constant";

/**
 * MainLayout provides the global navigation structure for the application.
 * It includes the NavSidebar (attached to the left/right based on direction)
 * and an Outlet for rendering page-specific content.
 */
export default function MainLayout() {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  // The rail is position:absolute, so this wrapper is the only thing reserving
  // space for it. Its width MUST track the rail's own expanded/collapsed state
  // (containers/sidebar-nav/use-sidebar-nav.js: isCollapsible = isInventoryPage)
  // or the opaque rail overhangs onto the page — which is what covered 170px of
  // the home 3D canvas.
  const isInventoryPage = (
    location.pathname.replace(/\/$/, "") || "/"
  ).endsWith("/inventory");
  const railWidth = isInventoryPage
    ? SIDEBAR_WIDTH.collapsed
    : SIDEBAR_WIDTH.expanded;

  return (
    <div className="flex h-screen w-screen bg-background text-white font-open-sans overflow-hidden relative">
      {/*
          Navigation Rail Wrapper
          Occupies fixed space in the layout flow to prevent shifting
      */}
      {/* <div
        className="hidden lg:block h-full shrink-0 relative z-[110]"
        style={{ width: `${railWidth}px` }}
      >
        <SidebarNavContainer />
      </div> */}

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 
            Content Area 
            Uses Outlet to render the current route's component
        */}
        <main className="flex-1 relative overflow-auto custom-scrollbar">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Fixed to viewport to avoid layout interference */}
      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[120] pointer-events-auto">
        <MobileNavContainer />
      </div> */}
    </div>
  );
}
