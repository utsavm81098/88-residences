import React from "react";
import useInventory from "./use-inventory";
import TopNavigation from "@/containers/top-navigation";
import SidebarPanel from "@/containers/sidebar-panel";
import BuildingTooltip from "@/features/building-tooltip";
import CanvasLoader from "@/containers/canvas-loader";
import { cn } from "@/lib/utils";

/**
 * InventoryContainer - Coordinates the 2D UI panels, controls, and tooltips
 * for the Inventory page over the single shared 3D Canvas.
 */
export default function InventoryContainer({ active = true }) {
  const {
    canvasHeight,
    handleResetCamera,
  } = useInventory({ active });

  return (
    <div
      className={cn(
        "flex h-full w-full overflow-hidden pointer-events-none select-none transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      {/* Active Content Panel (Takes 380px) - Co-exists with the global sidebar in the layout */}
      <div className="hidden lg:block w-[380px] h-full border-e border-gray-100 shrink-0 pointer-events-auto bg-sidebar-bg">
        <SidebarPanel />
      </div>

      <div
        className="relative flex-1 canvas-container h-full overflow-hidden pointer-events-none"
        style={{
          height: canvasHeight,
          transition: "height 0.3s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <TopNavigation {...{ onReset: handleResetCamera }} />
        <BuildingTooltip />
      </div>
    </div>
  );
}
