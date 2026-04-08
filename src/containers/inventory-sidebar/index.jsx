import React from "react";
import { useInventorySidebar } from "./use-inventory-sidebar";
import InventorySidebarUI from "../../components/ui/inventory-sidebar";

const InventorySidebarContainer = () => {
  const {
    activeAccordion,
    setActiveAccordion,
    filters,
    filteredUnits,
    groupedUnits,
    handleClearFilters,
    onUnitSelect,
    onFilterChange,
  } = useInventorySidebar();

  return (
    <InventorySidebarUI
      activeAccordion={activeAccordion}
      setActiveAccordion={setActiveAccordion}
      filters={filters}
      filteredUnits={filteredUnits}
      groupedUnits={groupedUnits}
      handleClearFilters={handleClearFilters}
      onUnitSelect={onUnitSelect}
      onFilterChange={onFilterChange}
    />
  );
};

export default InventorySidebarContainer;
