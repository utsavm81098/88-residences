import SidebarNavContainer from "@/containers/sidebar-nav";
import { Outlet } from "react-router";

/**
 * MainLayout provides the global navigation structure for the application.
 * It includes the NavSidebar (attached to the left/right based on direction)
 * and an Outlet for rendering page-specific content.
 */
export default function MainLayout() {
  return (
    <div className="flex h-screen w-screen bg-background text-white font-outfit overflow-hidden">
      {/* 
          Navigation Rail Wrapper 
          Occupies fixed space in the layout flow to prevent shifting 
      */}
      <div className="hidden lg:block w-[55px] h-full shrink-0 relative z-[110]">
        <SidebarNavContainer />
      </div>

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
