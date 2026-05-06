import React from "react";
import { useTranslation } from "react-i18next";
import InventoryFilters from "./components/inventory-filters";
import { Button } from "@/components/ui/button";
import InventoryList from "./components/inventory-list";
import { useInventorySidebar } from "@/containers/inventory-sidebar/use-inventory-sidebar";

const InventorySidebarContainer = () => {
  const {
    filters,
    handleClearFilters,
    onUnitSelect,
    onFilterChange,
    selectedUnit,
    finalData,
    activeAccordion,
    setActiveAccordion,
    currentBuilding,
    scrollRef,
    itemRefs,
    totalApartments,
    loading,
  } = useInventorySidebar();

  const { t, i18n } = useTranslation();

  return (
    <div
      dir={i18n.dir()}
      className="hidden lg:flex flex-col flex-1 h-full bg-sidebar-bg border-e border-white/5 text-white overflow-hidden z-[50]"
    >
      {/* Filters Section */}
      <div className="p-5">
        <InventoryFilters filters={filters} onFilterChange={onFilterChange} />

        {/* Clear/More Actions */}
        <div className="flex items-center justify-end pt-3">
          {/* <Button
            variant="link"
            className="h-auto p-0 text-[11px] font-medium text-white/40 hover:text-white"
          >
            {t("more_filters")}
          </Button> */}
          <Button
            variant="link"
            onClick={handleClearFilters}
            className="h-auto p-0 text-[11px] font-bold text-white/80 uppercase tracking-widest hover:text-white"
          >
            {t("clear_all")}
          </Button>
        </div>
      </div>

      <InventoryList
        {...{
          finalData,
          activeAccordion,
          setActiveAccordion,
          onUnitSelect,
          selectedUnit,
          handleClearFilters,
          currentBuilding,
          scrollRef,
          itemRefs,
          totalApartments,
          loading,
        }}
      />
    </div>
  );
};

export default InventorySidebarContainer;
