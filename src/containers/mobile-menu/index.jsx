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
      openEnquiry,
      setEnquiryOpen,
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
      <div className="flex lg:hidden">
        {/* ── MOBILE TOP BAR ── */}
        <div className="lg:hidden absolute top-6 left-4 right-4 flex items-center justify-between z-[1000] pointer-events-auto">
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-white rounded-full transition-colors active:scale-95 border-0 hover:bg-white/10"
          >
            <ICONS.ChevronLeft size={28} strokeWidth={2.5} />
          </Button>
          <div
            className="flex items-center gap-3 bg-sidebar px-5 py-2.5 rounded-full border border-white/10 text-white font-medium text-[15px] shadow-xl w-[60%] justify-center border-b-2 border-b-white/5 cursor-pointer active:scale-95 transition-all relative"
            onClick={openFilter}
          >
            <ICONS.Search size={18} className="text-white/60" />
            {t("find_property")}
            {activeFiltersCount > 0 && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-yellow flex items-center justify-center text-[11px] font-bold text-black border-2 border-sidebar">
                {activeFiltersCount}
              </div>
            )}
          </div>
          <div className="w-[36px]"></div>
        </div>

        <FilterOverlay {...{ isOpen: isFilterOpen, onClose: closeFilter }} />

        <div
          ref={sheetRef}
          className="fixed bottom-[52px] left-0 w-full bg-sidebar rounded-t-3xl shadow-2xl overflow-hidden z-[1]"
        >
          <div className="px-4 py-2 overflow-y-auto max-h-[calc(100vh-70px)] flex flex-col gap-2 items-center overflow-hidden">
            <div className="flex items-center justify-between relative w-full">
              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full border-0 hover:bg-white/10"
                onClick={handlePrev}
                disabled={buildings.length <= 1}
              >
                <ICONS.ChevronLeft size={20} strokeWidth={2.5} />
              </Button>

              <div
                className="text-center cursor-pointer py-0.5 px-4 rounded-xl active:bg-white/5 transition-colors"
                onClick={openFilter}
              >
                <span className="font-bold text-[16px] tracking-wide">
                  {t("block_name", "Block {{name}}", {
                    name: currentBuilding?.name,
                  })}
                </span>
                <span className="text-white/50 text-[13px] ml-1.5 font-medium">
                  ({buildingUnits?.length} {t("apt_count", "apt.")})
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full border-0 hover:bg-white/10"
                onClick={handleNext}
                disabled={buildings.length <= 1}
              >
                <ICONS.ChevronRight size={20} strokeWidth={2.5} />
              </Button>
            </div>

            {buildingUnits.length > 0 ? (
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
                        "pl-2.5 basis-[85%]",
                        buildingUnits.length === 1 &&
                          "pl-0 basis-full flex justify-center",
                      )}
                    >
                      <div
                        className={cn(buildingUnits.length === 1 && "w-[85%]")}
                      >
                        <ApartmentCard
                          {...{
                            unit,
                            isSelected: mobileSelectedUnit?.id === unit.id,
                            selectedBuilding: currentBuilding,
                            onEnquiry: openEnquiry,
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
