import { unitData } from "./constant";

export const BUDGET_RANGES = {
  "0 - 199K": [0, 199000],
  "199K - 398K": [199000, 398000],
  "398K - 596K": [398000, 596000],
  "596K+": [596000, Infinity],
};

export const ALL_UNITS = Object.entries(unitData).flatMap(([buildingName, units]) => {
  if (!Array.isArray(units)) return [];
  return units.map((unit) => ({ ...unit, buildingName }));
});

export const filterUnits = (units, selectedFilters) => {
  return units.filter((unit) => {
    // Rooms check
    const roomMatch =
      selectedFilters.rooms.length === 0 ||
      selectedFilters.rooms.some((r) => unit.type?.startsWith(r));

    // Type check
    const typeMatch =
      selectedFilters.type.length === 0 ||
      selectedFilters.type.some((t) => {
        if (t === "Gdn. Apt.") return unit.floor === 0;
        if (t === "PH") return unit.floor > 10;
        return unit.type === t || unit.type?.includes("Apartment");
      });

    // Exposure check
    const exposureMatch =
      selectedFilters.exposure.length === 0 ||
      selectedFilters.exposure.some((e) =>
        unit.direction?.includes(e.split(" ")[0]),
      );

    // Building check
    const buildingMatch =
      !selectedFilters.buildings ||
      selectedFilters.buildings === unit.buildingName;

    // Budget check
    let budgetMatch = true;
    if (selectedFilters.budget && BUDGET_RANGES[selectedFilters.budget]) {
      const [min, max] = BUDGET_RANGES[selectedFilters.budget];
      const price = parseInt(unit.price?.replace(/[^\d]/g, "") || "0");
      budgetMatch = price >= min && price <= max;
    }

    return (
      roomMatch &&
      typeMatch &&
      exposureMatch &&
      buildingMatch &&
      budgetMatch
    );
  });
};

export const getActiveFiltersCount = (selectedFilters) => {
  return Object.values(selectedFilters).reduce((acc, current) => {
    if (Array.isArray(current)) return acc + (current.length > 0 ? 1 : 0);
    return acc + (current !== null ? 1 : 0);
  }, 0);
};
