import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { unitData } from "../../utils/constant";
import { setSelectedUnit } from "../../store/slices/building-slice";

export const useInventorySidebar = () => {
  const [activeAccordion, setActiveAccordion] = useState("Type F");
  const [filters, setFilters] = useState({
    rooms: "all",
    type: "all",
    exposure: "all",
  });
  const dispatch = useDispatch();

  // Flat list of all units from all buildings for filtering
  const allUnits = useMemo(() => {
    return Object.entries(unitData).flatMap(([buildingName, units]) => {
      if (!Array.isArray(units)) return [];
      return units.map((unit) => ({ ...unit, buildingName }));
    });
  }, []);

  // Filter logic
  const filteredUnits = useMemo(() => {
    return allUnits.filter((unit) => {
      const roomMatch =
        filters.rooms === "all" || unit.type?.startsWith(filters.rooms);
      const typeMatch = filters.type === "all" || unit.status === filters.type;
      const exposureMatch =
        filters.exposure === "all" ||
        unit.direction?.includes(filters.exposure);
      return roomMatch && typeMatch && exposureMatch;
    });
  }, [allUnits, filters]);

  // Group filtered units by building for Accordion
  const groupedUnits = useMemo(() => {
    return filteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});
  }, [filteredUnits]);

  const handleClearFilters = () => {
    setFilters({ rooms: "all", type: "all", exposure: "all" });
  };

  const onUnitSelect = (unit) => {
    dispatch(setSelectedUnit(unit));
  };

  const onFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return {
    activeAccordion,
    setActiveAccordion,
    filters,
    filteredUnits,
    groupedUnits,
    handleClearFilters,
    onUnitSelect,
    onFilterChange,
  };
};
