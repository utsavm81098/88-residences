import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router";
import gsap from "gsap";
import {
  setFilters,
  setSelectedUnit,
  setBuilding,
  clearFilters,
  selectFilteredInventory,
} from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { getActiveFiltersCount } from "@/utils/filter-helper";

export const useInventorySidebar = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryBuilding = searchParams.get("building")?.toUpperCase();

  const scrollRef = useRef(null);
  const itemRefs = useRef({});

  // Fine-grained Redux selectors: avoids re-rendering on unrelated building state changes
  const currentBuildingName = useSelector(
    (state) => state.building.currentBuilding?.name,
  );
  const selectedUnit = useSelector((state) => state.building.selectedUnit);
  const filters = useSelector((state) => state.building.filters);
  const loading = useSelector((state) => state.building.loading);
  const filteredUnits = useSelector(selectFilteredInventory);

  const initialTargetBuilding = queryBuilding || currentBuildingName || "A";

  // Keep a ref to the latest building name for stable handler callbacks
  const currentBuildingNameRef = useRef(currentBuildingName || initialTargetBuilding);
  useEffect(() => {
    currentBuildingNameRef.current = currentBuildingName || initialTargetBuilding;
  }, [currentBuildingName, initialTargetBuilding]);

  const [activeAccordionState, setActiveAccordionState] = useState(() => [
    initialTargetBuilding,
  ]);

  const activeAccordion = useMemo(() => {
    return (
      activeAccordionState ?? [
        currentBuildingName || initialTargetBuilding || "A",
      ]
    );
  }, [activeAccordionState, currentBuildingName, initialTargetBuilding]);

  const finalData = useMemo(() => {
    if (!filteredUnits || filteredUnits.length === 0) return [];
    // Group by building name for the sidebar accordion
    const grouped = filteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});

    // Return as a pre-sorted array of [building, units] entries
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredUnits]);

  // Deterministic smooth scroll: computes the exact post-collapse position of the target building
  // to ensure monotonic, unidirectional scrolling with zero rubber-banding or direction reversal.
  const scrollToBuilding = useCallback(
    (buildingName) => {
      const container = scrollRef.current;
      if (!container || !buildingName) return;

      const targetIndex = finalData.findIndex(([b]) => b === buildingName);
      if (targetIndex === -1) return;

      let targetTop = 0;
      if (targetIndex > 0) {
        for (let i = 0; i < targetIndex; i++) {
          const [b] = finalData[i];
          const el = itemRefs.current[b];
          // Height of each closed card is its trigger header height + 2px border (defaults to 50px)
          const trigger = el?.querySelector('[data-slot="accordion-trigger"]');
          const headerHeight = trigger ? trigger.offsetHeight : 48;
          // Card border (2px) + gap-3 (12px) between accordion items
          targetTop += headerHeight + 2 + 12;
        }
      }

      gsap.killTweensOf(container);
      gsap.to(container, {
        scrollTop: targetTop,
        duration: 0.38,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    [finalData],
  );

  // Sync active accordion whenever currentBuildingName changes
  useEffect(() => {
    if (currentBuildingName) {
      setActiveAccordionState([currentBuildingName]);
    }
  }, [currentBuildingName]);

  // Smooth scroll on building change OR when finalData finishes loading on first render (e.g. ?building=D)
  useEffect(() => {
    const targetBuilding = currentBuildingName || initialTargetBuilding;
    if (!targetBuilding || finalData.length === 0) return;

    scrollToBuilding(targetBuilding);

    return () => {
      if (scrollRef.current) {
        gsap.killTweensOf(scrollRef.current);
      }
    };
  }, [currentBuildingName, finalData, initialTargetBuilding, scrollToBuilding]);

  // Stable Accordion Change Handler: opens clicked building & updates 3D view and URL
  const handleAccordionChange = useCallback(
    (newValues) => {
      const currentName = currentBuildingNameRef.current;
      const newlySelected = Array.isArray(newValues)
        ? newValues.find((val) => val !== currentName) ||
          (newValues.includes(currentName) ? currentName : null)
        : newValues;

      if (newlySelected) {
        if (newlySelected !== currentName) {
          const buildingIndex = BUILDING_CONFIG.findIndex(
            (b) => b.name === newlySelected,
          );
          if (buildingIndex !== -1) {
            dispatch(setBuilding(buildingIndex));
          }
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("building", newlySelected);
              return next;
            },
            { replace: true },
          );
        }
        setActiveAccordionState([newlySelected]);
        scrollToBuilding(newlySelected);
      } else {
        setActiveAccordionState([]);
      }
    },
    [dispatch, scrollToBuilding, setSearchParams],
  );

  // Stable filter change handler
  const onFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
    },
    [dispatch],
  );

  // Stable unit select handler
  const onUnitSelect = useCallback(
    (unit) => {
      const currentName = currentBuildingNameRef.current;
      if (unit.buildingName === currentName) {
        dispatch(setSelectedUnit(unit));
      } else {
        const buildingIndex = BUILDING_CONFIG.findIndex(
          (b) => b.name === unit.buildingName,
        );
        if (buildingIndex !== -1) {
          dispatch(setBuilding(buildingIndex));
          dispatch(setSelectedUnit(unit));
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("building", unit.buildingName);
              return next;
            },
            { replace: true },
          );
        }
      }
    },
    [dispatch, setSearchParams],
  );

  // Stable clear filters handler
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const totalApartments = filteredUnits.length;

  const activeFilterCount = useMemo(
    () => getActiveFiltersCount(filters),
    [filters],
  );

  return {
    filters,
    onFilterChange,
    finalData,
    totalApartments,
    activeFilterCount,
    handleClearFilters,
    activeAccordion,
    setActiveAccordion: handleAccordionChange,
    onUnitSelect,
    selectedUnit,
    currentBuildingName,
    scrollRef,
    itemRefs,
    loading,
  };
};

export default useInventorySidebar;
