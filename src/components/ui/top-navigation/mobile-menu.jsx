import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  setSelectedUnit,
  setSnap,
} from "../../../store/slices/building-slice";
import ApartmentCard from "./apartment-card";
import { ICONS } from "@/assets/icons";
import { Carousel, CarouselContent, CarouselItem } from "../carousel";

const MobileMenu = ({
  handleNext,
  handlePrev,
  currentBuilding,
  totalApt,
  buildingUnits,
}) => {
  const sheetRef = useRef(null);
  const lastSyncedIndex = useRef(-1);
  const dispatch = useDispatch();
  const { selectedUnit, snap } = useSelector((state) => state.building);

  const [api, setApi] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const unitsRef = useRef(buildingUnits);

  unitsRef.current = buildingUnits;

  const getSnapPoints = () => {
    const vh = window.visualViewport?.height || window.innerHeight;
    return [vh * 0.4];
  };

  const snapPoints = getSnapPoints();

  // ✅ Animate
  const animateTo = (index) => {
    const height = snapPoints[index];
    dispatch(setSnap({ height, snapIndex: index }));

    gsap.to(sheetRef.current, {
      height,
      duration: 0.35,
      ease: "power3.out",
    });
  };

  // Sync initial height from Redux or default
  useEffect(() => {
    if (sheetRef.current) {
      const initialHeight = snapPoints[0];
      gsap.set(sheetRef.current, { height: initialHeight });
      dispatch(setSnap({ height: initialHeight, snapIndex: 0 }));
    }
  }, []);

  const handleApi = useCallback(
    (apiInstance) => {
      if (!apiInstance) return;
      setApi(apiInstance);
      apiInstance.off("select");
      const updateActive = () => {
        const index = apiInstance.selectedScrollSnap();
        // 🚫 prevent loop conflict
        if (lastSyncedIndex.current === index) return;
        lastSyncedIndex.current = index;
        setActiveIndex(index);
        const unit = unitsRef.current[index];
        // ✅ only dispatch if different
        if (!selectedUnit || unit?.name !== selectedUnit?.name) {
          dispatch(setSelectedUnit(unit));
        }
      };
      apiInstance.on("select", updateActive);
      // ✅ initialize only if no selectedUnit
      if (!selectedUnit && unitsRef.current.length) {
        updateActive();
      }
    },
    [dispatch, selectedUnit],
  );

  useEffect(() => {
    if (!api || !selectedUnit || !unitsRef.current.length) return;

    const index = unitsRef.current.findIndex(
      (u) => u.name === selectedUnit.name,
    );

    // ❌ if not found → fallback to 0
    const finalIndex = index !== -1 ? index : 0;

    // 🚫 prevent unnecessary updates
    if (lastSyncedIndex.current === finalIndex) return;

    lastSyncedIndex.current = finalIndex;

    // ✅ scroll carousel
    api.scrollTo(finalIndex, true);

    // ✅ update active UI
    setActiveIndex(finalIndex);
  }, [selectedUnit, api]);

  useEffect(() => {
    const handleResize = () => {
      animateTo(0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex md:hidden">
      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden absolute top-6 left-4 right-4 flex items-center justify-between z-[1000] pointer-events-auto">
        <button className="text-white p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95">
          <ICONS.ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3 bg-sidebar px-5 py-2.5 rounded-full border border-white/10 text-white font-medium text-[15px] shadow-xl w-[60%] justify-center border-b-2 border-b-white/5">
          <ICONS.Search size={18} className="text-white/60" />
          Find property
        </div>
        <div className="w-[36px]"></div>
      </div>

      {/* <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 w-full bg-sidebar rounded-t-3xl shadow-2xl overflow-hidden z-[1]"
      >
        <div className="px-4 py-2 overflow-y-auto h-full max-h-[100vh] flex flex-col gap-2 items-center overflow-hidden">
    
          <div className="flex items-center justify-between relative w-full">
            <button
              className="p-3 text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              onClick={handlePrev}
            >
              <ICONS.ChevronLeft size={20} strokeWidth={2.5} />
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
              <ICONS.ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>

          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={handleApi}
            className="w-full"
          >
            <CarouselContent data-vaul-no-drag>
              {buildingUnits.map((unit, idx) => (
                <CarouselItem
                  key={`${unit.name}-${idx}`}
                  className="pl-3 basis-[85%]"
                >
                  <ApartmentCard
                    unit={unit}
                    isSelected={selectedUnit?.name === unit.name}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div> */}
    </div>
  );
};

export default MobileMenu;
