import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  setSelectedUnit,
  setSnap,
} from "../../../redux/reducers/buildingSlice";
import ApartmentCard from "./apartment-card";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";
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

    return [
      85,
      vh * 0.4,
      vh - 80, // 👈 THIS is calc(100vh - 70px)
    ];
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
      const initialHeight = snapPoints[snap.snapIndex] || snapPoints[0];
      gsap.set(sheetRef.current, { height: initialHeight });
    }
  }, []);

  // -------------------
  // DRAG LOGIC (FIXED)
  // -------------------
  let startY = 0;
  let startX = 0;
  let startHeight = 0;
  let isDragging = false;
  let isVertical = null;

  const onStart = (clientY, clientX) => {
    startY = clientY;
    startX = clientX;
    startHeight = sheetRef.current.offsetHeight;

    isDragging = true;
    isVertical = null;
  };

  const onMove = (clientY, clientX) => {
    if (!isDragging) return;

    const deltaY = startY - clientY;
    const deltaX = startX - clientX;

    // 👇 detect direction once
    if (isVertical === null) {
      isVertical = Math.abs(deltaY) > Math.abs(deltaX);
    }

    // ❌ ignore horizontal swipe
    if (!isVertical) return;

    let newHeight = startHeight + deltaY;

    const min = snapPoints[0];
    const max = snapPoints[2];

    if (newHeight < min) newHeight = min;
    if (newHeight > max) newHeight = max;

    gsap.set(sheetRef.current, { height: newHeight });
  };

  const onEnd = () => {
    if (!isDragging) return;

    isDragging = false;

    // ❌ if horizontal gesture → ignore
    if (!isVertical) return;

    const currentHeight = sheetRef.current.offsetHeight;

    const closestIndex = snapPoints.reduce((prev, curr, index) => {
      return Math.abs(curr - currentHeight) <
        Math.abs(snapPoints[prev] - currentHeight)
        ? index
        : prev;
    }, 0);

    animateTo(closestIndex);
  };

  // Touch
  const handleTouchStart = (e) =>
    onStart(e.touches[0].clientY, e.touches[0].clientX);

  const handleTouchMove = (e) =>
    onMove(e.touches[0].clientY, e.touches[0].clientX);

  const handleTouchEnd = () => onEnd();

  // Mouse
  const handleMouseDown = (e) => {
    onStart(e.clientY, e.clientX);

    const move = (e) => onMove(e.clientY, e.clientX);
    const up = () => {
      onEnd();
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

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

    // ✅ FIX: ensure bottom sheet opens properly
    if (snap.snapIndex !== 1) {
      animateTo(1);
    }
  }, [selectedUnit, api, snap.snapIndex]);

  useEffect(() => {
    const handleResize = () => {
      animateTo(snap.snapIndex);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [snap.snapIndex]);

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

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 w-full bg-[#1f2530] rounded-t-3xl shadow-2xl overflow-hidden z-[1]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Handle */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-6 overflow-y-auto h-full max-h-[100vh] flex flex-col items-center">
          {/* ── HEADER: Block Name + Navigation ── */}
          {snap.snapIndex === 0 ? (
            <div className="flex items-center justify-between relative w-full">
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
          ) : null}

          {/* {snap.snapIndex === 1 ? ( */}
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={handleApi}
            className="w-full pt-3"
          >
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
          {/* ) : null} */}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
