import React from "react";
import { useUnitInfoCard } from "./use-unit-info-card";
import UnitInfoCardView from "./components/unit-info-card-view";

/**
 * UnitInfoCardContainer - Smart container for the property unit info card.
 * Following SOP: Connects business logic to UI via custom hooks.
 */
const UnitInfoCardContainer = ({ unit, selectedBuilding }) => {
  const logic = useUnitInfoCard({ unit });

  return (
    <UnitInfoCardView
      unit={unit}
      selectedBuilding={selectedBuilding}
      {...logic}
    />
  );
};

export default UnitInfoCardContainer;

