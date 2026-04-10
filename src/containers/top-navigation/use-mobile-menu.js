import { useState, useCallback, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import {
  setMobileSelectedUnit,
  setSnap,
} from "@/store/slices/building-slice";

/**
 * Hook for the mobile bottom sheet menu.
 */
export const useMobileMenu = ({ buildingUnits }) => {
  const sheetRef = useRef(null);
  const lastSyncedIndex = useRef(-1);
  const dispatch = useDispatch();

  // Optimized selective selectors to minimize re-renders
  const mobileSelectedUnit = useSelector((state) => state.building.mobileSelectedUnit);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);

  const [api, setApi] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Keep units in ref for stable callback access
  const unitsRef = useRef(buildingUnits);
  useEffect(() => {
    unitsRef.current = buildingUnits;
  }, [buildingUnits]);

  const animateTo = useCallback(
    (height) => {
      dispatch(setSnap({ height, snapIndex: 1 }));

      gsap.to(sheetRef.current, {
        height,
        duration: 0.35,
        ease: "power3.out",
      });
    },
    [dispatch],
  );

  // Safe height observer - only depends on mounting
  useEffect(() => {
    if (!sheetRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.scrollHeight;
        if (height > 0) {
          dispatch(setSnap({ height, snapIndex: 1 }));
          gsap.to(sheetRef.current, { height, duration: 0.3, ease: "power2.out" });
        }
      }
    });

    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [dispatch]);

  const handleApi = useCallback(
    (apiInstance) => {
      if (!apiInstance) return;
      setApi(apiInstance);

      const updateActive = () => {
        const index = apiInstance.selectedScrollSnap();
        if (lastSyncedIndex.current === index) return;

        lastSyncedIndex.current = index;
        setActiveIndex(index);
        const unit = unitsRef.current[index];

        if (unit) {
          dispatch(setMobileSelectedUnit(unit));
        }
      };

      apiInstance.on("select", updateActive);
    },
    [dispatch],
  );

  // Sync carousel position & handle building changes
  useEffect(() => {
    if (!api || !unitsRef.current.length) return;

    const currentUnit = selectedUnit || mobileSelectedUnit;

    // Check if the current unit belongs to the active building
    const foundIndex = currentUnit 
      ? unitsRef.current.findIndex((u) => u.name === currentUnit.name)
      : -1;

    if (foundIndex === -1) {
      // Logic for building change or invalid selection: default to first unit
      api.scrollTo(0, true);
      lastSyncedIndex.current = 0;
      setActiveIndex(0);
      const firstUnit = unitsRef.current[0];
      if (firstUnit) {
        dispatch(setMobileSelectedUnit(firstUnit));
      }
      return;
    }

    // Sync if needed
    if (lastSyncedIndex.current !== foundIndex) {
      lastSyncedIndex.current = foundIndex;
      api.scrollTo(foundIndex, true);
      setActiveIndex(foundIndex);
    }

    // Secondary sync: ensure Redux mobileSelectedUnit stays in sync with selectedUnit
    if (
      selectedUnit &&
      (!mobileSelectedUnit || selectedUnit.name !== mobileSelectedUnit.name)
    ) {
      dispatch(setMobileSelectedUnit(selectedUnit));
    }
  }, [buildingUnits, selectedUnit, mobileSelectedUnit, api, dispatch]);

  // Re-snap logic
  useEffect(() => {
    const handleResize = () => animateTo(0);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [animateTo]);

  return {
    sheetRef,
    mobileSelectedUnit,
    activeIndex,
    handleApi,
  };
};

export default useMobileMenu;
