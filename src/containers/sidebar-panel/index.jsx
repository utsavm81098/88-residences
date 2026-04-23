import React from "react";
import { useSelector } from "react-redux";
import InventorySidebar from "@/containers/inventory-sidebar";

const SidebarPanel = () => {
  const activePanel = useSelector((state) => state.sidebar.activePanel);

  // For now, only inventory is implemented. Others can be stubs.
  switch (activePanel) {
    case "inventory":
      return <InventorySidebar />;
    case "gallery":
      return (
        <div className="w-[300px] h-full bg-sidebar-bg p-6 flex flex-col gap-4 border-r border-white/5">
          <h2 className="text-xl font-bold text-accent-yellow">Gallery</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-white/50 text-sm italic">
              Gallery panel content coming soon...
            </p>
          </div>
        </div>
      );
    case "map":
      return (
        <div className="w-[300px] h-full bg-sidebar-bg p-6 flex flex-col gap-4 border-r border-white/5">
          <h2 className="text-xl font-bold text-accent-yellow">Location Map</h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-white/50 text-sm italic">
              Location map content coming soon...
            </p>
          </div>
        </div>
      );
    default:
      return (
        <div className="w-[300px] h-full bg-sidebar-bg p-6 flex flex-col gap-4 border-r border-white/5">
          <h2 className="text-xl font-bold capitalize text-accent-yellow">
            {activePanel}
          </h2>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-white/50 text-sm italic">
              Content for {activePanel} coming soon...
            </p>
          </div>
        </div>
      );
  }
};

export default SidebarPanel;
