import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import gsap from "gsap";
import {
  setMobileSelectedUnit,
  setSnap,
} from "@/store/slices/building-slice";
import useInventory from "@/hooks/use-inventory";

/**
 * Hook for the mobile bottom sheet menu.
 */
export const useMobileMenu = ({ buildingUnits }) => {
  const sheetRef = useRef(null);
  const lastSyncedIndex = useRef(-1);
  const dispatch = useDispatch();

  const {
    currentBuildingUnits,
    activeFiltersCount,
    selectedUnit,
    filters,
    mobileSelectedUnit
  } = useInventory();

  // On mobile, if no filters are active, we show all units of the current building
  // If filters are active, we show the intersection
  const displayUnits = useMemo(() => {
    return activeFiltersCount > 0 ? currentBuildingUnits : buildingUnits;
  }, [activeFiltersCount, currentBuildingUnits, buildingUnits]);

  // Keep units in ref for stable callback access
  const unitsRef = useRef(displayUnits);
  useEffect(() => {
    unitsRef.current = displayUnits;
  }, [displayUnits]);

  const [api, setApi] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const openFilter = useCallback(() => setIsFilterOpen(true), []);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);

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
    if (!api) return;

    if (!unitsRef.current.length) {
      if (mobileSelectedUnit) {
        dispatch(setMobileSelectedUnit(null));
      }
      return;
    }

    // Use a stable reference for the current selected unit to sync carousel
    const currentUnit = mobileSelectedUnit; 

    const foundIndex = currentUnit 
      ? unitsRef.current.findIndex((u) => u.name === currentUnit.name)
      : -1;

    if (foundIndex === -1) {
      if (lastSyncedIndex.current !== 0) {
        api.scrollTo(0, true);
        lastSyncedIndex.current = 0;
        setActiveIndex(0);
      }
      // Always ensure the first unit is selected when the previous selection becomes invalid
      // This fixes the issue where changing buildings or applying filters leaves no valid selection
      const firstUnit = unitsRef.current[0];
      if (firstUnit) {
        dispatch(setMobileSelectedUnit(firstUnit));
      }
      return;
    }

    if (lastSyncedIndex.current !== foundIndex) {
      lastSyncedIndex.current = foundIndex;
      api.scrollTo(foundIndex, true);
      setActiveIndex(foundIndex);
    }
  }, [displayUnits, mobileSelectedUnit, api, dispatch]);

  // Re-snap logic
  useEffect(() => {
    const handleResize = () => animateTo(0);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [animateTo]);

  return {
    sheetRef,
    activeIndex,
    handleApi,
    isFilterOpen,
    openFilter,
    closeFilter: () => setIsFilterOpen(false),
    displayUnits,
    activeFiltersCount,
    mobileSelectedUnit, // Restore this
  };
};

export default useMobileMenu;
