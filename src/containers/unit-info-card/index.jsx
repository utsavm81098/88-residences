import React from "react";
import { useUnitInfoCard } from "@/containers/unit-info-card/use-unit-info-card";
import UnitInfoCardView from "@/containers/unit-info-card/unit-info-card-view";
import EnquiryDialog from "@/containers/enquiry-dialog";

/**
 * UnitInfoCardContainer - Smart container for the property unit info card.
 * Following SOP: Connects business logic to UI via custom hooks.
 */
const UnitInfoCardContainer = ({ unit, selectedBuilding }) => {
  const logic = useUnitInfoCard({ unit });

  return (
    <>
      <UnitInfoCardView
        {...{
          unit,
          selectedBuilding,
          ...logic,
        }}
      />
      <EnquiryDialog
        {...{
          isEnquiryOpen: logic.isEnquiryOpen,
          setEnquiryOpen: logic.setEnquiryOpen,
          unit,
          selectedBuilding,
          t: logic.t,
          lang: logic.lang,
        }}
      />
    </>
  );
};

export default UnitInfoCardContainer;
