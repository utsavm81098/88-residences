import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchInventory } from "@/store/slices/building-slice";
import ParentBridge from "@/containers/parent-bridge";
import KeepAliveOutlet from "@/containers/keep-alive-outlet";
import useKeepAliveKey from "@/hooks/use-keep-alive-key";
import SidebarNavContainer from "@/containers/sidebar-nav";
import MobileNavContainer from "@/containers/mobile-nav";
import { SIDEBAR_WIDTH } from "@/utils/constant";

/**
 * MainLayout provides the global shell for the application.
 * It renders the Outlet for routed pages and mounts the ParentBridge for iframe host communication.
 */
export default function MainLayout() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  // The rail is position:absolute, so this wrapper is the only thing reserving
  // space for it. Its width MUST track the rail's own expanded/collapsed state
  // (containers/sidebar-nav/use-sidebar-nav.js: isCollapsible = isInventoryPage)
  // or the opaque rail overhangs onto the page — which is what covered 170px of
  // the home 3D canvas.
  // Same source of truth the KeepAliveOutlet uses, so the rail width can never
  // disagree with which view is actually showing. Replaces a pathname-suffix
  // test that had to re-derive the route independently.
  const activeKey = useKeepAliveKey();
  const railWidth =
    activeKey === "inventory"
      ? SIDEBAR_WIDTH.collapsed
      : SIDEBAR_WIDTH.expanded;

  return (
    <div className="flex h-screen w-screen bg-background text-white font-open-sans overflow-hidden relative">
      {/* Synchronization bridge with parent iframe / WordPress host */}
      <ParentBridge />

      {/* Main viewport area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* 
            Content Area 
            Uses Outlet to render the current route's component
        */}
        <main className="flex-1 relative overflow-auto custom-scrollbar">
          <div className="w-full h-full">
            <KeepAliveOutlet />
          </div>
        </main>
      </div>
    </div>
  );
}
