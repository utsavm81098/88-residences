import React from "react";
import ApartmentCard from "./apartment-card";
import { ICONS } from "@/assets/icons";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";
import useMobileMenu from "./use-mobile-menu";
import { Button } from "@/components/ui/button";

const MobileMenu = ({
  handleNext,
  handlePrev,
  currentBuilding,
  totalApt,
  buildingUnits,
}) => {
  const { sheetRef, mobileSelectedUnit, activeIndex, handleApi } =
    useMobileMenu({
      buildingUnits,
    });

  return (
    <div className="flex md:hidden">
      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden absolute top-6 left-4 right-4 flex items-center justify-between z-[1000] pointer-events-auto">
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-white rounded-full transition-colors active:scale-95 border-0 hover:bg-white/10"
        >
          <ICONS.ChevronLeft size={28} strokeWidth={2.5} />
        </Button>
        <div className="flex items-center gap-3 bg-sidebar px-5 py-2.5 rounded-full border border-white/10 text-white font-medium text-[15px] shadow-xl w-[60%] justify-center border-b-2 border-b-white/5">
          <ICONS.Search size={18} className="text-white/60" />
          Find property
        </div>
        <div className="w-[36px]"></div>
      </div>

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 w-full bg-sidebar rounded-t-3xl shadow-2xl overflow-hidden z-[1]"
      >
        <div className="px-4 py-2 overflow-y-auto max-h-[100vh] flex flex-col gap-2 items-center overflow-hidden">
          <div className="flex items-center justify-between relative w-full">
            <Button
              variant="ghost"
              size="icon"
              className="text-white rounded-full border-0 hover:bg-white/10"
              onClick={handlePrev}
            >
              <ICONS.ChevronLeft size={20} strokeWidth={2.5} />
            </Button>

            <div className="text-center cursor-pointer py-0.5 px-4 rounded-xl">
              <span className="font-bold text-[16px] tracking-wide">
                Block {currentBuilding.name}
              </span>
              <span className="text-white/50 text-[13px] ml-1.5 font-medium">
                ({totalApt} apt.)
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white rounded-full border-0 hover:bg-white/10"
              onClick={handleNext}
            >
              <ICONS.ChevronRight size={20} strokeWidth={2.5} />
            </Button>
          </div>

          {buildingUnits.length > 0 ? (
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              setApi={handleApi}
              className="w-full pb-2"
            >
              <CarouselContent data-vaul-no-drag>
                {buildingUnits.map((unit, idx) => (
                  <CarouselItem
                    key={`${unit.name}-${idx}`}
                    className="pl-3 basis-[85%]"
                  >
                    <ApartmentCard
                      unit={unit}
                      isSelected={mobileSelectedUnit?.name === unit.name}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="w-full h-32 flex items-center justify-center text-white/50 text-sm">
              No units currently available for this building.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
