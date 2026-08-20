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
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { getDashboardRoute } from "@/utils/helper";
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

  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const navigate = useNavigate();

  const handleHomeClick = React.useCallback(() => {
    navigate(getDashboardRoute(i18n));
  }, [navigate, i18n]);

  const buildings = BUILDING_CONFIG;

  return (
    <>
      {/* Desktop Top Navigation Bar */}
      <div className="hidden lg:flex absolute top-10 left-0 right-0 px-6 items-center z-10 pointer-events-none select-none">
        {/* Left: Home Icon Button */}
        <div className="flex-1 flex justify-start pointer-events-auto ml-4">
          <Button
            variant="ghost"
            size="icon-xl"
            className="bg-white border border-border-light rounded-full text-accent-yellow shadow-xl pointer-events-auto hover:!bg-gray-100 hover:text-accent-yellow active:!bg-gray-200 transition-all cursor-pointer size-[70px]"
            onClick={handleHomeClick}
            aria-label="Home"
          >
            <ICONS.Home
              size={32}
              strokeWidth={2}
              className="size-[30px] text-accent-yellow"
            />
          </Button>
        </div>

        {/* Center: Building Navigation Pill */}
        <div className="relative pointer-events-auto">
          <DropdownMenu onOpenChange={(open) => onToggleMenu(open)}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between h-14 px-4 bg-white border border-border-light rounded-full shadow-xl transition-all duration-200 hover:border-gray-300 cursor-pointer px-[40px] h-[80px]">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-gray-700 hover:text-gray-900 hover:!bg-gray-100 active:!bg-gray-200 rounded-full border-0 transition-all cursor-pointer"
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
                    className="size-[30px] rtl:-scale-x-100 text-accent-yellow"
                  />
                </Button>

                <div
                  className={cn(
                    "mx-6 text-gray-800 font-open-sans font-semibold text-2xl tracking-wider transition-colors flex items-center justify-center gap-1.5",
                    buildings.length > 1
                      ? "hover:text-gray-900"
                      : "cursor-default",
                  )}
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  {isRtl ? (
                    <>
                      <span className="text-gray-800">{t("building")}</span>
                      <span className="text-accent-yellow font-bold">
                        {currentBuilding?.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-accent-yellow font-bold">
                        {currentBuilding?.name}
                      </span>
                      <span className="text-gray-800">{t("building")}</span>
                    </>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="text-gray-700 hover:text-gray-900 hover:!bg-gray-100 active:!bg-gray-200 rounded-full border-0 transition-all cursor-pointer"
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
                    className="size-[30px] rtl:-scale-x-100 text-accent-yellow"
                  />
                </Button>
              </div>
            </DropdownMenuTrigger>

            {buildings.length > 1 && (
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white border border-border-light rounded-2xl shadow-2xl overflow-hidden p-0 z-[9999] text-gray-900 mt-2"
                align="center"
              >
                <div className="max-h-[230px] overflow-y-auto custom-scrollbar py-1">
                  {buildings.map((b, idx) => (
                    <DropdownMenuItem
                      key={b.name}
                      className={cn(
                        "px-6 py-4 text-center font-open-sans text-base cursor-pointer transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 outline-none flex items-center justify-center gap-1.5 border-b border-gray-100 last:border-b-0",
                        currentBuilding.name === b.name
                          ? "bg-accent-yellow/10 font-bold"
                          : "font-medium text-gray-700",
                      )}
                      onClick={() => handleSelect(idx)}
                      dir={isRtl ? "rtl" : "ltr"}
                    >
                      {isRtl ? (
                        <>
                          <span className="text-gray-800">{t("building")}</span>
                          <span className="text-accent-yellow font-bold">
                            {b.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-accent-yellow font-bold">
                            {b.name}
                          </span>
                          <span className="text-gray-800">{t("building")}</span>
                        </>
                      )}
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
            className="hidden bg-nav/85 backdrop-blur-md border border-white/10 rounded-full text-white shadow-2xl pointer-events-auto hover:border-white/20 size-[80px]"
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
