import UnitInfoCardContainer from "@/containers/unit-info-card";
import React from "react";

const DesktopPopup = ({ selectedUnit, desktopPopupRef, selectedBuilding }) => {
  return (
    <div
      ref={desktopPopupRef}
      className={`fixed ltr:right-6 rtl:left-6 top-10 z-10 w-[260px] hidden lg:block opacity-0 pointer-events-none`}
    >
      {selectedUnit && (
        <UnitInfoCardContainer
          unit={selectedUnit}
          selectedBuilding={selectedBuilding}
        />
      )}
    </div>
  );
};

export default DesktopPopup;
