import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import InventoryFilters from "./components/inventory-filters";
import { Button } from "@/components/ui/button";
import InventoryList from "./components/inventory-list";
import { useInventorySidebar } from "@/containers/inventory-sidebar/use-inventory-sidebar";
import { ICONS } from "@/assets/icons";

const InventorySidebarContainer = memo(() => {
  const {
    filters,
    handleClearFilters,
    onUnitSelect,
    onFilterChange,
    selectedUnit,
    finalData,
    activeAccordion,
    setActiveAccordion,
    scrollRef,
    itemRefs,
    totalApartments,
    activeFilterCount,
    loading,
  } = useInventorySidebar();

  const { t, i18n } = useTranslation();

  return (
    <div
      dir={i18n.dir()}
      className="hidden lg:flex flex-col flex-1 h-full bg-white text-gray-900 border-e border-gray-100 overflow-hidden z-[50]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 font-bold text-gray-800 text-[14px]">
          <ICONS.Filter size={20} className="text-gray-500" />
          <span>
            {t("filters", "Filters")} ({activeFilterCount})
          </span>
        </div>
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          className="h-8 px-2.5 py-1 rounded-xl hover:!bg-gray-100 text-[14px] font-bold text-gray-600 hover:!text-gray-900 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ICONS.RotateCcw size={20} className="text-gray-500" />
          <span>{t("clear_all", "Clear all")}</span>
        </Button>
      </div>

      {/* Fixed Filters Grid */}
      <div className="px-3.5 pb-3 shrink-0">
        <InventoryFilters filters={filters} onFilterChange={onFilterChange} />
      </div>

      {/* Scrollable Building & Inventory List Only */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-3.5 pb-4">
        <InventoryList
          finalData={finalData}
          activeAccordion={activeAccordion}
          setActiveAccordion={setActiveAccordion}
          onUnitSelect={onUnitSelect}
          selectedUnit={selectedUnit}
          handleClearFilters={handleClearFilters}
          scrollRef={scrollRef}
          itemRefs={itemRefs}
          totalApartments={totalApartments}
          loading={loading}
        />
      </div>
    </div>
  );
});

export default InventorySidebarContainer;
