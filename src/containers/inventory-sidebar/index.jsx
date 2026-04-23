import React from "react";
import { useInventorySidebar } from "./use-inventory-sidebar";
import InventorySidebarUI from "./inventory-sidebar-ui";

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
    scrollContainerRef,
    selectedUnit,
    favorites,
    onToggleFavorite,
    sortConfig,
    onSort,
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
      scrollContainerRef={scrollContainerRef}
      selectedUnit={selectedUnit}
      favorites={favorites}
      onToggleFavorite={onToggleFavorite}
      sortConfig={sortConfig}
      onSort={onSort}
    />
  );
};

export default InventorySidebarContainer;
