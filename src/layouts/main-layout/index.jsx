import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet } from "react-router";
import { fetchInventory } from "@/store/slices/building-slice";
import ParentBridge from "@/containers/parent-bridge";

/**
 * MainLayout provides the global shell for the application.
 * It renders the Outlet for routed pages and mounts the ParentBridge for iframe host communication.
 */
export default function MainLayout() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
