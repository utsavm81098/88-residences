import React from "react";
import useFilterOverlay from "./use-filter-overlay";
import FilterOverlayUI from "./filter-overlay-ui";

const FilterOverlay = ({ isOpen, onClose }) => {
  const {
    selectedFilters,
    toggleFilter,
    handleClearAll,
    handleApplyFilters,
    filteredCount,
    activeFiltersCount,
    buildings,
  } = useFilterOverlay({ isOpen, onClose });

  return (
    <FilterOverlayUI
      isOpen={isOpen}
      onClose={onClose}
      selectedFilters={selectedFilters}
      toggleFilter={toggleFilter}
      handleClearAll={handleClearAll}
      handleApplyFilters={handleApplyFilters}
      filteredCount={filteredCount}
      activeFiltersCount={activeFiltersCount}
      buildings={buildings}
    />
  );
};

export default FilterOverlay;
