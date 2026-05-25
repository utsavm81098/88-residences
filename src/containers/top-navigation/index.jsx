import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { ICONS } from "@/assets/icons";
import MobileMenu from "@/containers/mobile-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTopNavigation } from "./use-top-navigation";
import { BUILDING_CONFIG } from "@/utils/constant";

const TopNavigationContainer = memo(({ onReset }) => {
  const {
    currentBuilding,
    totalApt,
    buildingUnits,
    handleNext,
    handlePrev,
    handleSelect,
    onToggleMenu,
  } = useTopNavigation();

  const buildings = BUILDING_CONFIG;

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <div className="hidden lg:flex absolute top-10 left-0 right-0 px-6 items-center z-10 pointer-events-none select-none">
        {/* Left Spacer to keep navigation centered */}
        <div className="flex-1" />

        {/* Center: Building Navigation Pill */}
        <div className="relative pointer-events-auto">
          <DropdownMenu onOpenChange={(open) => onToggleMenu(open)}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between h-14 px-4 bg-nav/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all duration-200 hover:border-white/20 cursor-pointer px-[40px] h-[80px]">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-white/70 hover:text-white rounded-full border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronLeft
                    size={30}
                    strokeWidth={2}
                    className="size-[30px] rtl:-scale-x-100"
                  />
                </Button>

                <div
                  className={cn(
                    "mx-6 text-white font-open-sans font-semibold text-2xl tracking-wider transition-colors",
                    buildings.length > 1
                      ? "hover:text-white/80"
                      : "cursor-default",
                  )}
                >
                  {currentBuilding?.name + " Building"}
                </div>

                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-white/70 hover:text-white rounded-full border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronRight
                    size={30}
                    strokeWidth={2}
                    className="size-[30px] rtl:-scale-x-100"
                  />
                </Button>
              </div>
            </DropdownMenuTrigger>

            {buildings.length > 1 && (
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] bg-nav/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl overflow-hidden p-0 z-[9999]"
                align="center"
              >
                <div className="max-h-[230px] overflow-y-auto custom-scrollbar py-1">
                  {buildings.map((b, idx) => (
                    <DropdownMenuItem
                      key={b.name}
                      className={cn(
                        "px-6 py-4 text-center text-white font-open-sans text-base cursor-pointer transition-colors hover:bg-white/10 focus:bg-white/10 outline-hidden block",
                        currentBuilding.name === b.name
                          ? "bg-white/5 font-bold"
                          : "font-medium",
                      )}
                      onClick={() => handleSelect(idx)}
                    >
                      {b.name + " Building"}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>

        {/* Right: Reset Button */}

        <div className="flex-1 flex justify-end pointer-events-auto mr-4">
          <Button
            variant="ghost"
            size="icon-xl"
            className="bg-nav/85 backdrop-blur-md border border-white/10 rounded-full text-white shadow-2xl pointer-events-auto hover:border-white/20 size-[80px]"
            onClick={onReset}
          >
            <ICONS.RotateCw size={30} strokeWidth={2} className="size-[30px]" />
          </Button>
        </div>
      </div>

      {/* Left Navigation Arrow (Desktop) */}
      <div className="hidden lg:flex absolute top-1/2 start-6 -translate-y-1/2 z-[1000] pointer-events-none select-none">
        <Button
          variant="ghost"
          className={cn(
            "size-48 bg-transparent text-white/40",
            "hover:text-white hover:!bg-transparent hover:scale-105",
            "transition-all pointer-events-auto disabled:opacity-50",
          )}
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          disabled={buildings.length <= 1}
          aria-label="Previous building"
        >
          <ICONS.ChevronLeft
            className="!size-40 rtl:-scale-x-100"
            strokeWidth={1}
          />
        </Button>
      </div>

      {/* Right Navigation Arrow (Desktop) */}
      <div className="hidden lg:flex absolute top-1/2 end-6 -translate-y-1/2 z-[1000] pointer-events-none select-none">
        <Button
          variant="ghost"
          className={cn(
            "size-48 bg-transparent text-white/40",
            "hover:text-white hover:!bg-transparent hover:scale-105",
            "transition-all pointer-events-auto disabled:opacity-50",
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          disabled={buildings.length <= 1}
          aria-label="Next building"
        >
          <ICONS.ChevronRight
            className="!size-40 rtl:-scale-x-100"
            strokeWidth={1}
          />
        </Button>
      </div>

      {/* Mobile Top Bar */}
      <MobileMenu
        handleNext={handleNext}
        handlePrev={handlePrev}
        currentBuilding={currentBuilding}
        totalApt={totalApt}
        buildingUnits={buildingUnits}
      />
    </>
  );
});

export default TopNavigationContainer;
