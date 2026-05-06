import React from "react";
import { useTranslation } from "react-i18next";
import { FilterGroup } from "@/components/ui/filter-group";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { FilterRange } from "@/components/ui/filter-range";
import { FILTER_OPTIONS } from "@/utils/constant";
import { cn } from "@/lib/utils";

/**
 * Common filter components used in both InventorySidebar (Desktop)
 * and FilterOverlay (Mobile/Tablet).
 */
const InventoryFilters = ({ filters, onFilterChange, className }) => {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      {/* Rooms Filter */}
      <FilterGroup
        label={t("rooms")}
        className="flex-row items-center justify-between gap-2"
      >
        <FilterTabs
          value={filters.rooms}
          onValueChange={(val) => onFilterChange("rooms", val)}
          options={FILTER_OPTIONS.rooms}
          triggerClassName="text-[10px] sm:text-[11px] p-3"
          className="w-auto"
        />
      </FilterGroup>

      {/* Direction Filter */}
      <FilterGroup
        label={t("direction")}
        className="flex-row items-center justify-between gap-2"
      >
        <FilterTabs
          value={filters.direction}
          onValueChange={(val) => onFilterChange("direction", val)}
          options={FILTER_OPTIONS.direction}
          triggerClassName="p-3"
          className="w-auto"
        />
      </FilterGroup>

      {/* Price Range */}
      <FilterRange
        label={t("price")}
        min={FILTER_OPTIONS.priceRange.min}
        max={FILTER_OPTIONS.priceRange.max}
        step={1000}
        value={
          filters.price?.length === 2
            ? filters.price
            : [FILTER_OPTIONS.priceRange.min, FILTER_OPTIONS.priceRange.max]
        }
        onValueChange={(val) => onFilterChange("price", val)}
        prefix="€"
      />

      {/* Area Range */}
      <FilterRange
        label={t("area_sqm")}
        min={FILTER_OPTIONS.areaRange.min}
        max={FILTER_OPTIONS.areaRange.max}
        step={1}
        value={
          filters.areas?.length === 2
            ? filters.areas
            : [FILTER_OPTIONS.areaRange.min, FILTER_OPTIONS.areaRange.max]
        }
        onValueChange={(val) => onFilterChange("areas", val)}
        unit="sqm"
        formatValue={(val) => val}
      />
    </div>
  );
};

export default InventoryFilters;
