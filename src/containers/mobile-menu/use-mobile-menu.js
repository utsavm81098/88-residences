import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import gsap from "gsap";
import {
  setMobileSelectedUnit,
  setSnapHeight,
} from "@/store/slices/building-slice";
import useToggleState from "@/hooks/use-toggle-state";
import useBottomMenuHeight from "@/hooks/use-bottom-menu-height";

import { getActiveFiltersCount } from "@/utils/filter-helper";
import { getWebsiteRedirectUrl } from "@/utils/helper";
import { useTranslation } from "react-i18next";

/**
 * Hook for the mobile bottom sheet menu.
 */
export const useMobileMenu = ({ buildingUnits }) => {
  const { i18n } = useTranslation();
  const sheetRef = useRef(null);
  const lastSyncedIndex = useRef(-1);
  const lastScrollHeight = useRef(0);
  const dispatch = useDispatch();
  const { bottomMenuHeight } = useBottomMenuHeight();

  const { mobileSelectedUnit, filters, currentBuilding, loading } = useSelector(
    (state) => state.building,
  );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const resizeObserverRef = useRef(null);
  const timeoutRef = useRef(null);

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
      if (!sheetRef.current || height <= 0) return;
      if (height === lastScrollHeight.current) return;
      lastScrollHeight.current = height;

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

  // ResizeObserver for container size adjustments (e.g. screen resizes, orientations)
  useEffect(() => {
    if (!sheetRef.current) return;

    const contentEl = sheetRef.current.firstElementChild;
    if (!contentEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        // Only trigger layout updates if the content height has actually changed
        if (height > 0 && height !== lastScrollHeight.current) {
          lastScrollHeight.current = height;
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

    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [dispatch]);

  // Handle active content/building/units change and recalculate height
  useEffect(() => {
    if (!sheetRef.current) return;

    const updateHeight = () => {
      const contentEl = sheetRef.current.firstElementChild;
      if (!contentEl) return;
      const height = contentEl.getBoundingClientRect().height;
      if (height > 0 && height !== lastScrollHeight.current) {
        lastScrollHeight.current = height;
        dispatch(setSnapHeight(height));
        gsap.killTweensOf(sheetRef.current);
        gsap.to(sheetRef.current, {
          height,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    updateHeight();
    const timeoutId = setTimeout(updateHeight, 50); // safety fallback for dynamic layouts settling
    return () => clearTimeout(timeoutId);
  }, [buildingUnits, currentBuilding, dispatch]);

  const handleApi = useCallback((apiInstance) => {
    if (!apiInstance) return;
    setApi(apiInstance);
  }, []);

  // Listen to carousel snaps with active cleanup to prevent memory leaks
  useEffect(() => {
    if (!api) return;

    const updateActive = () => {
      const index = api.selectedScrollSnap();
      if (lastSyncedIndex.current === index) return;

      lastSyncedIndex.current = index;
      const unit = unitsRef.current[index];

      if (unit) {
        dispatch(setMobileSelectedUnit(unit));
      }
    };

    api.on("select", updateActive);
    return () => {
      api.off("select", updateActive);
    };
  }, [api, dispatch]);

  // Sync carousel position & handle building changes
  useEffect(() => {
    if (!api || !unitsRef.current.length) return;

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

  const textRef = useCallback(
    (node) => {
      // Clean up previous observer and timeout
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (node) {
        const check = () => {
          const truncated = node.scrollWidth > node.clientWidth + 1;
          setIsTruncated(truncated);
          if (!truncated) {
            setTooltipOpen(false);
          }
        };

        check();
        timeoutRef.current = setTimeout(check, 50);

        const observer = new ResizeObserver(() => {
          check();
        });
        observer.observe(node);
        resizeObserverRef.current = observer;
      }
    },
    [currentBuilding, buildingUnits],
  );

  // Ensure clean up of refs on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTooltipToggle = useCallback(
    (e) => {
      e.stopPropagation();
      if (isTruncated) {
        setTooltipOpen((prev) => !prev);
      }
    },
    [isTruncated],
  );

  const handleTooltipOpenChange = useCallback(
    (open) => {
      if (isTruncated) {
        setTooltipOpen(open);
      } else {
        setTooltipOpen(false);
      }
    },
    [isTruncated],
  );

  const handleEnquiryClick = useCallback(
    (e) => {
      e.stopPropagation();
      openEnquiry();
    },
    [openEnquiry],
  );

  const handleBackClick = useCallback(() => {
    window.location.href = getWebsiteRedirectUrl(i18n);
  }, [i18n]);

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
    bottomMenuHeight,
    tooltipOpen,
    isTruncated,
    textRef,
    handleTooltipToggle,
    handleTooltipOpenChange,
    handleEnquiryClick,
    handleBackClick,
    loading,
  };
};

export default useMobileMenu;
