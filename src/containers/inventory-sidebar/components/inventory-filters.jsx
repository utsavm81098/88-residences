import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { FilterGroup } from "@/components/ui/filter-group";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { FilterRange } from "@/components/ui/filter-range";
import { FILTER_OPTIONS } from "@/utils/constant";
import { ICONS } from "@/assets/icons";
import { cn } from "@/lib/utils";

const InventoryFilters = memo(({ filters, onFilterChange, className }) => {
  const { t, i18n } = useTranslation();

  return (
    <div dir={i18n.dir()} className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 w-full", className)}>
      {/* Bedrooms Filter */}
      <FilterGroup label={t("bedrooms")} icon={ICONS.Bedrooms}>
        <FilterTabs
          value={filters.rooms}
          onValueChange={(val) => onFilterChange("rooms", val)}
          options={FILTER_OPTIONS.rooms}
        />
      </FilterGroup>

      {/* Direction Filter */}
      <FilterGroup label={t("direction")} icon={ICONS.Compass}>
        <FilterTabs
          value={filters.direction}
          onValueChange={(val) => onFilterChange("direction", val)}
          options={FILTER_OPTIONS.direction}
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
});

export default InventoryFilters;
