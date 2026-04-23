import { memo } from "react";
import { cn } from "@/lib/utils";
import { ICONS } from "@/assets/icons";
import MobileMenu from "./mobile-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TopNavigation = memo(
  ({
    currentBuilding,
    isMenuOpen,
    totalApt,
    buildingUnits,
    handleNext,
    handlePrev,
    handleSelect,
    onToggleMenu,
    onReset,
    buildings,
    menuRef,
  }) => {
    return (
      <>
        <div className="hidden md:flex absolute top-6 ltr:right-6 rtl:left-6 items-center gap-3 pointer-events-none z-[1000] select-none">
          <div className="relative pointer-events-auto">
            <DropdownMenu onOpenChange={(open) => onToggleMenu(open)}>
              <div className="flex items-center justify-between min-w-[200px] h-12 px-3 bg-nav/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all duration-200 hover:border-white/20">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-white/70 hover:text-white rounded-full border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronLeft
                    size={20}
                    strokeWidth={2}
                    className="rtl:rotate-180"
                  />
                </Button>

                <DropdownMenuTrigger asChild>
                  <div
                    className={cn(
                      "mx-4 text-white font-outfit font-semibold text-base tracking-wider transition-colors",
                      buildings.length > 1
                        ? "cursor-pointer hover:text-white/80"
                        : "cursor-default",
                    )}
                  >
                    {currentBuilding.name}
                  </div>
                </DropdownMenuTrigger>

                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-white/70 hover:text-white rounded-full border-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronRight
                    size={20}
                    strokeWidth={2}
                    className="rtl:rotate-180"
                  />
                </Button>
              </div>

              {buildings.length > 1 && (
                <DropdownMenuContent
                  className="w-[200px] bg-nav/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl overflow-hidden p-0"
                  align="center"
                  sideOffset={8}
                >
                  <div className="max-h-[240px] overflow-y-auto custom-scrollbar py-1">
                    {buildings.map((b, idx) => (
                      <DropdownMenuItem
                        key={b.name}
                        className={cn(
                          "px-4 py-3 text-center text-white font-outfit text-sm cursor-pointer transition-colors hover:bg-white/10 focus:bg-white/10 outline-none block",
                          currentBuilding.name === b.name
                            ? "bg-white/5 font-bold"
                            : "font-medium",
                        )}
                        onClick={() => handleSelect(idx)}
                      >
                        {b.name}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>
          <Button
            variant="ghost"
            size="icon-lg"
            className="bg-nav/85 backdrop-blur-md border border-white/10 rounded-full text-white shadow-2xl pointer-events-auto hover:-translate-y-0.5"
            onClick={onReset}
          >
            <ICONS.RotateCw size={20} strokeWidth={2} />
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
  },
);

export default TopNavigation;
