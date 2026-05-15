import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import gsap from "gsap";
import {
  setMobileSelectedUnit,
  setSnapHeight,
} from "@/store/slices/building-slice";
import useToggleState from "@/hooks/use-toggle-state";

import { getActiveFiltersCount } from "@/utils/filter-helper";

/**
 * Hook for the mobile bottom sheet menu.
 */
export const useMobileMenu = ({ buildingUnits }) => {
  const sheetRef = useRef(null);
  const lastSyncedIndex = useRef(-1);
  const dispatch = useDispatch();

  const { mobileSelectedUnit, filters } = useSelector(
    (state) => state.building,
  );

  const activeFiltersCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );

  // Keep units in ref for stable callback access
  const unitsRef = useRef(buildingUnits);
  useEffect(() => {
    unitsRef.current = buildingUnits;
  }, [buildingUnits]);

  const [api, setApi] = useState(null);
  const [isFilterOpen, openFilter, closeFilter] = useToggleState(false);
  const [isEnquiryOpen, openEnquiry, closeEnquiry, , setEnquiryOpen] =
    useToggleState(false);

  const animateTo = useCallback(
    (height) => {
      if (!sheetRef.current) return;
      dispatch(setSnapHeight(height));

      gsap.killTweensOf(sheetRef.current);
      gsap.to(sheetRef.current, {
        height,
        duration: 0.35,
        ease: "power3.out",
      });
    },
    [dispatch],
  );

  // Capture initial height and observe changes
  useEffect(() => {
    if (!sheetRef.current) return;

    const updateHeight = () => {
      requestAnimationFrame(() => {
        if (!sheetRef.current) return;
        const height = sheetRef.current.scrollHeight;
        if (height > 0) {
          dispatch(setSnapHeight(height));
          gsap.killTweensOf(sheetRef.current);
          gsap.to(sheetRef.current, {
            height,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      });
    };

    updateHeight();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.target.scrollHeight || entry.contentRect.height;
        if (height > 0) {
          dispatch(setSnapHeight(height));
          gsap.killTweensOf(sheetRef.current);
          gsap.to(sheetRef.current, {
            height,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      }
    });

    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, [dispatch, buildingUnits]);

  const handleApi = useCallback(
    (apiInstance) => {
      if (!apiInstance) return;
      setApi(apiInstance);

      const updateActive = () => {
        const index = apiInstance.selectedScrollSnap();
        if (lastSyncedIndex.current === index) return;

        lastSyncedIndex.current = index;
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

    // Use a stable reference for the current selected unit to sync carousel
    const currentUnit = mobileSelectedUnit;

    const foundIndex = currentUnit
      ? unitsRef.current.findIndex((u) => u.id === currentUnit.id)
      : -1;

    if (foundIndex === -1) {
      if (lastSyncedIndex.current !== 0) {
        api.scrollTo(0, true);
        lastSyncedIndex.current = 0;
      }
      const firstUnit = unitsRef.current[0];
      if (firstUnit && mobileSelectedUnit?.id !== firstUnit.id) {
        dispatch(setMobileSelectedUnit(firstUnit));
      }
      return;
    }

    if (lastSyncedIndex.current !== foundIndex) {
      lastSyncedIndex.current = foundIndex;
      api.scrollTo(foundIndex, true);
    }
  }, [buildingUnits, mobileSelectedUnit, api, dispatch]);

  // Re-snap logic on window resize
  useEffect(() => {
    const handleResize = () => {
      if (sheetRef.current) {
        const height = sheetRef.current.scrollHeight;
        dispatch(setSnapHeight(height));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  return {
    sheetRef,
    handleApi,
    isFilterOpen,
    openFilter,
    closeFilter,
    isEnquiryOpen,
    openEnquiry,
    closeEnquiry,
    setEnquiryOpen,
    activeFiltersCount,
    mobileSelectedUnit,
  };
};

export default useMobileMenu;
