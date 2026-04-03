import React, { useState, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ApartmentCard from "./apartment-card";

import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";

// Snap points: collapsed (header only ~148px), half (50%), expanded (90%)
const SNAP_POINTS = ["90px", 0.5, 0.9];

const MobileMenu = ({
  handleNext,
  handlePrev,
  currentBuilding,
  totalApt,
  buildingUnits,
}) => {
  const [snap, setSnap] = useState(SNAP_POINTS[0]);

  const handleSnapChange = useCallback((snapPoint) => {
    if (snapPoint !== undefined && snapPoint !== null) {
      setSnap(snapPoint);
    }
  }, []);

  // Cards are visible when sheet is at half or expanded snap
  const showCards = snap !== SNAP_POINTS[0];

  return (
    <div className="flex md:hidden">
      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden absolute top-6 left-4 right-4 flex items-center justify-between z-[1000] pointer-events-auto">
        <button className="text-white p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
          <IconChevronLeft size={28} stroke={2.5} />
        </button>
        <div className="flex items-center gap-3 bg-[#1e1f26] px-5 py-2.5 rounded-full border border-white/10 text-white font-medium text-[15px] shadow-xl w-[60%] justify-center border-b-2 border-b-white/5">
          <IconSearch size={18} className="text-white/60" />
          Find property
        </div>
        <div className="w-[36px]"></div>
      </div>

      {/* ── MOBILE BOTTOM SHEET (Vaul Drawer with Snap Points) ── */}

      <Drawer
        open={true}
        modal={false}
        snapPoints={SNAP_POINTS}
        activeSnapPoint={snap}
        setActiveSnapPoint={handleSnapChange}
        dismissible={false}
        fadeFromIndex={1}
      >
        <DrawerContent className="pointer-events-auto md:hidden">
          {/* Vaul Handle — tap to cycle snap points, drag to move */}
          <DrawerHandle />

          {/* Accessible title for screen readers */}
          <DrawerTitle className="sr-only">
            Building {currentBuilding.name} Apartments
          </DrawerTitle>

          {/* ── HEADER: Block Name + Navigation ── */}
          <div>
            <div className="flex items-center justify-between px-3 py-0 relative">
              <button
                className="p-3 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                onClick={handlePrev}
              >
                <IconChevronLeft size={20} stroke={2.5} />
              </button>

              <div className="text-center cursor-pointer py-0.5 px-4 rounded-xl">
                <span className="font-bold text-[16px] tracking-wide">
                  Block {currentBuilding.name}
                </span>
                <span className="text-white/50 text-[13px] ml-1.5 font-medium">
                  ({totalApt} apt.)
                </span>
              </div>

              <button
                className="p-3 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                onClick={handleNext}
              >
                <IconChevronRight size={20} stroke={2.5} />
              </button>
            </div>
          </div>

          {/* ── APARTMENT CARDS (visible at half & expanded snap) ── */}
          <div
            className={`transition-all duration-300 ease-out overflow-hidden ${
              showCards
                ? "opacity-100 flex-1"
                : "opacity-0 max-h-0 pointer-events-none"
            }`}
          >
            <Carousel className="w-full" opts={{ align: "center", loop: true }}>
              {/* Swipe hint text */}
              {showCards && (
                <div className="text-center text-white/40 text-[11px] font-medium pb-2">
                  Swipe cards horizontally
                </div>
              )}
              <CarouselContent className="pb-6 pt-2" data-vaul-no-drag>
                {buildingUnits.map((unit, idx) => (
                  <CarouselItem
                    key={`${unit.name}-${idx}`}
                    className="pl-5 basis-[82%]"
                  >
                    <ApartmentCard unit={unit} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default MobileMenu;
