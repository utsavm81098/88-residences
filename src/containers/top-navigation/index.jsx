import React from "react";
import { useTopNavigation } from "./use-top-navigation";
import { BUILDING_CONFIG } from "../../utils/constant";
import TopNavigationUI from "../../components/ui/top-navigation";

const TopNavigationContainer = ({ onReset }) => {
  const {
    currentBuilding,
    isMenuOpen,
    totalApt,
    buildingUnits,
    handleNext,
    handlePrev,
    handleSelect,
    onToggleMenu,
  } = useTopNavigation();

  return (
    <TopNavigationUI
      currentBuilding={currentBuilding}
      isMenuOpen={isMenuOpen}
      totalApt={totalApt}
      buildingUnits={buildingUnits}
      handleNext={handleNext}
      handlePrev={handlePrev}
      handleSelect={handleSelect}
      onToggleMenu={onToggleMenu}
      onReset={onReset}
      buildings={BUILDING_CONFIG}
    />
  );
};

export default TopNavigationContainer;
