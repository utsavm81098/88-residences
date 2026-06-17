import React, { Fragment } from "react";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import useBuildingTooltip from "./use-building-tooltip";
import HoverTooltip from "./hover-tooltip";
import DesktopPopup from "./desktop-popup";
const BuildingTooltip = () => {
  const {
    t,
    lang,
    unit,
    status,
    popupUnit,
    selectedBuilding,
    showHoverTooltip,
    desktopPopupRef,
    hoverTooltipRef,
    isMobile,
  } = useBuildingTooltip();

  return (
    <Fragment>
      {/* ── Hover Tooltip ── */}
      <ComponentErrorBoundary name="HoverTooltip">
        {unit ? (
          <HoverTooltip
            unit={unit}
            status={status}
            selectedBuilding={selectedBuilding}
            showHoverTooltip={showHoverTooltip}
            hoverTooltipRef={hoverTooltipRef}
            t={t}
            lang={lang}
          />
        ) : null}
      </ComponentErrorBoundary>

      {/* ── Desktop Selection Popup ── */}
      <ComponentErrorBoundary name="DesktopPopup">
        {!isMobile && (
          <DesktopPopup
            selectedUnit={popupUnit}
            desktopPopupRef={desktopPopupRef}
            selectedBuilding={selectedBuilding}
          />
        )}
      </ComponentErrorBoundary>
    </Fragment>
  );
};

export default BuildingTooltip;
