import React, { memo, useMemo } from "react";
import ApartmentCard from "./apartment-card";
import EnquiryDialog from "@/containers/enquiry-dialog";
import { ICONS } from "@/assets/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import FilterOverlay from "@/containers/filter-overlay";
import { cn } from "@/lib/utils";
import useMobileMenu from "./use-mobile-menu";
import { BUILDING_CONFIG } from "@/utils/constant";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MobileMenuContainer = memo(
  ({ handleNext, handlePrev, currentBuilding, buildingUnits }) => {
    const {
      sheetRef,
      mobileSelectedUnit,
      handleApi,
      isFilterOpen,
      openFilter,
      closeFilter,
      activeFiltersCount,
      isEnquiryOpen,
      setEnquiryOpen,
      bottomMenuHeight,
      tooltipOpen,
      handleTooltipOpenChange,
      isTruncated,
      textRef,
      handleTooltipToggle,
      handleEnquiryClick,
      handleBackClick,
      loading,
    } = useMobileMenu({
      buildingUnits,
    });

    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === "rtl";
    const buildings = BUILDING_CONFIG;

    const carouselOpts = useMemo(
      () => ({
        align: "center",
        loop: buildingUnits.length > 1,
        direction: isRtl ? "rtl" : "ltr",
      }),
      [buildingUnits.length, isRtl],
    );

    return (
      <div className="flex lg:hidden" dir={isRtl ? "rtl" : "ltr"}>
        <FilterOverlay {...{ isOpen: isFilterOpen, onClose: closeFilter }} />

        {/* 
          Floating wrapper for search bar and bottom sheet.
          Set to pointer-events-none so it doesn't block OrbitControls on the canvas behind it.
          Children elements use pointer-events-auto.
        */}
        <div
          className="fixed left-0 right-0 z-[1000] pointer-events-none flex flex-col justify-end items-center"
          style={{ bottom: `${bottomMenuHeight}px` }}
        >
          {/* ── MOBILE TOP BAR (Floating Search Bar + Back Button) ── */}
          <div
            id="mobileTopBar"
            className="w-full px-4 mb-3 flex items-center justify-between pointer-events-auto"
          >
            <Button
              variant="ghost"
              size="icon-lg"
              className="text-white rounded-full transition-colors active:scale-95 border border-mobile-topbar-border bg-mobile-topbar-bg hover:bg-white/10"
              onClick={handleBackClick}
            >
              <ICONS.ChevronLeft
                size={28}
                strokeWidth={2.5}
                className="rtl:-scale-x-100"
              />
            </Button>
            <div
              className="flex items-center gap-3 bg-mobile-topbar-bg px-5 py-2.5 rounded-full border border-mobile-topbar-border text-white font-medium text-[15px] shadow-xl w-auto min-w-[160px] max-w-[70%] justify-center cursor-pointer active:scale-95 transition-all relative whitespace-nowrap"
              onClick={openFilter}
            >
              <ICONS.Search size={18} className="text-white/60 shrink-0" />
              {t("find_property")}
              {activeFiltersCount > 0 && (
                <div className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center text-[11px] font-bold text-black border-2 border-sidebar">
                  {activeFiltersCount}
                </div>
              )}
            </div>
            <div className="w-[36px]"></div>
          </div>

          {/* Bottom Sheet */}
          <div
            ref={sheetRef}
            className="w-full bg-sidebar rounded-t-3xl shadow-2xl overflow-hidden pointer-events-auto"
          >
            <div className="px-4 py-2 overflow-y-auto max-h-[calc(100vh-70px)] flex flex-col gap-2 items-center overflow-hidden">
              <div className="flex items-center justify-between relative w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white rounded-full border-0 hover:bg-white/10 shrink-0"
                  onClick={handlePrev}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronLeft
                    size={20}
                    strokeWidth={2.5}
                    className="rtl:-scale-x-100"
                  />
                </Button>

                <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 cursor-pointer py-1 px-1 rounded-xl active:bg-white/5 transition-colors min-w-0 max-w-[180px] justify-center flex-1">
                    <Tooltip
                      open={tooltipOpen}
                      onOpenChange={handleTooltipOpenChange}
                    >
                      <TooltipTrigger asChild>
                        <span
                          ref={textRef}
                          className="font-bold text-[16px] tracking-wide whitespace-nowrap truncate min-w-0"
                          onClick={handleTooltipToggle}
                        >
                          {t("block_name", "Block {{name}}", {
                            name: currentBuilding?.name,
                          })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[1100]">
                        {t("block_name", "Block {{name}}", {
                          name: currentBuilding?.name,
                        })}
                      </TooltipContent>
                    </Tooltip>
                    <span className="text-white/50 text-[13px] font-medium whitespace-nowrap shrink-0">
                      ({buildingUnits?.length} {t("apt_count", "apt.")})
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 gap-1.5 text-[12px] uppercase font-bold rounded-full border border-accent-yellow/30 text-accent-yellow bg-accent-yellow/5 hover:!bg-accent-yellow hover:!text-white transition-all duration-300 group shadow-lg shrink-0"
                    onClick={handleEnquiryClick}
                  >
                    <ICONS.Mail
                      size={12}
                      className="text-accent-yellow group-hover:text-white transition-colors"
                    />
                    <span>{t("enquiry")}</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white rounded-full border-0 hover:bg-white/10 shrink-0"
                  onClick={handleNext}
                  disabled={buildings.length <= 1}
                >
                  <ICONS.ChevronRight
                    size={20}
                    strokeWidth={2.5}
                    className="rtl:-scale-x-100"
                  />
                </Button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-5 text-white/30 gap-3">
                  <ICONS.RotateCw
                    className="animate-spin"
                    size={32}
                    strokeWidth={1}
                  />
                  <span className="text-[12px] uppercase tracking-widest animate-pulse">
                    {t("loading")}...
                  </span>
                </div>
              ) : buildingUnits.length > 0 ? (
                <Carousel
                  {...{
                    opts: carouselOpts,
                    setApi: handleApi,
                    className: "w-full pb-2",
                  }}
                >
                  <CarouselContent
                    data-vaul-no-drag
                    className={cn(
                      buildingUnits.length === 1 && "justify-center ml-0",
                    )}
                  >
                    {buildingUnits.map((unit, idx) => (
                      <CarouselItem
                        key={`${unit?.apartment_number}-${idx}`}
                        className={cn(
                          "basis-[85%]",
                          buildingUnits.length === 1 &&
                            "pl-0 basis-full flex justify-center",
                        )}
                      >
                        <div
                          className={cn(
                            buildingUnits.length === 1 && "w-[85%]",
                          )}
                        >
                          <ApartmentCard
                            {...{
                              unit,
                              isSelected: mobileSelectedUnit?.id === unit.id,
                              selectedBuilding: currentBuilding,
                            }}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-white/50 text-sm">
                  {t(
                    "no_units_available",
                    "No units currently available for this building.",
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <EnquiryDialog
          {...{
            isEnquiryOpen,
            setEnquiryOpen,
            unit: mobileSelectedUnit,
            selectedBuilding: currentBuilding,
            t,
            lang: i18n.language,
          }}
        />
      </div>
    );
  },
);

export default MobileMenuContainer;
