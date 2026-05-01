import React from "react";
import { useSelector } from "react-redux";
import InventorySidebar from "@/containers/inventory-sidebar";

const SidebarPanel = () => {
  const activePanel = useSelector((state) => state.sidebar.activePanel);

  if (!activePanel || activePanel === "home") return null;

  // For now, only inventory is implemented. Others can be stubs.
  switch (activePanel) {
    case "home":
      return null;
    case "inventory":
      return <InventorySidebar />;
    default:
      return (
        <div className="w-full h-full bg-sidebar-bg p-6 flex flex-col gap-4 border-e border-white/5">
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
