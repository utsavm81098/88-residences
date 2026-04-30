import { FILTER_OPTIONS } from "@/utils/constant";

export const normalizeInventory = (inventory) => {
  if (!inventory) return [];

  // Handle flat array from API
  if (Array.isArray(inventory)) {
    return inventory.map((unit) => ({
      ...unit,
      buildingName: unit.building_name || unit.building || unit.buildingName || "A",
      rooms: unit.rooms || unit.type || "1",
      price: unit.price || "0",
      area: unit.area || "0",
      direction: unit.direction || unit.property_direction || "Front",
    }));
  }

  // Handle object keyed by building name
  if (typeof inventory === "object" && Object.keys(inventory).length > 0) {
    return Object.entries(inventory).flatMap(([buildingName, units]) => {
      if (!Array.isArray(units)) return [];
      return units.map((unit) => ({ 
        ...unit, 
        buildingName,
        rooms: unit.rooms || unit.type || "1",
        price: unit.price || "0",
        area: unit.area || "0",
        direction: unit.direction || unit.property_direction || "Front",
      }));
    });
  }

  return [];
};

export const getActiveFiltersCount = (filters) => {
  if (!filters) return 0;
  let count = 0;

  if (filters.status?.length > 0) count++;
  if (filters.rooms?.length > 0) count++;
  if (filters.direction?.length > 0) count++;

  // Only count price if it's different from default range
  if (filters.price?.length === 2) {
    const isDefault = 
      filters.price[0] === FILTER_OPTIONS.priceRange.min && 
      filters.price[1] === FILTER_OPTIONS.priceRange.max;
    if (!isDefault) count++;
  }

  // Only count areas if different from default range
  if (filters.areas?.length === 2) {
    const isDefault = 
      filters.areas[0] === FILTER_OPTIONS.areaRange.min && 
      filters.areas[1] === FILTER_OPTIONS.areaRange.max;
    if (!isDefault) count++;
  }
  
  if (filters.buildings) count++;

  return count;
};

export const filterUnits = (units, selectedFilters) => {
  if (!Array.isArray(units)) return [];
  if (!selectedFilters) return units;

  return units.filter((unit) => {
    // 1. Status Filter
    if (selectedFilters.status?.length > 0) {
      const status = unit.apartment_sold ? "sold" : unit.status || "available";
      if (!selectedFilters.status.includes(status)) return false;
    }

    // 2. Rooms check
    if (selectedFilters.rooms?.length > 0) {
      const unitRoomStr = unit.bedrooms?.name?.en || unit.rooms || "";
      const unitRoomVal = parseInt(unitRoomStr);

      const roomMatch = selectedFilters.rooms.some((r) => {
        if (r === "studio")
          return String(unitRoomStr).toLowerCase().includes("studio");
        return parseInt(r) === unitRoomVal;
      });
      if (!roomMatch) return false;
    }

    // 3. Direction check
    if (selectedFilters.direction?.length > 0) {
      const unitDir = (
        unit.property_direction?.name?.en ||
        unit.direction ||
        ""
      ).toLowerCase();
      const directionMatch = selectedFilters.direction.some((d) =>
        unitDir.includes(d.toLowerCase()),
      );
      if (!directionMatch) return false;
    }

    // 4. Price Range check
    if (selectedFilters.price?.length === 2) {
      const price =
        unit.apartment_price_raw ??
        parseInt(String(unit.price || "0").replace(/[^\d]/g, ""), 10);
      if (price < selectedFilters.price[0] || price > selectedFilters.price[1])
        return false;
    }

    // 5. Area Range check
    if (selectedFilters.areas?.length === 2) {
      const area =
        unit.apartment_area ??
        parseFloat(String(unit.area || "0").split(" ")[0]);
      if (area < selectedFilters.areas[0] || area > selectedFilters.areas[1])
        return false;
    }

    // 6. Building check
    if (
      selectedFilters.buildings &&
      selectedFilters.buildings !== unit.buildingName
    ) {
      return false;
    }

    return true;
  });
};
