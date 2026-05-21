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
    selectedUnit,
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
        {!isMobile && selectedUnit ? (
          <DesktopPopup
            selectedUnit={selectedUnit}
            desktopPopupRef={desktopPopupRef}
            selectedBuilding={selectedBuilding}
          />
        ) : null}
      </ComponentErrorBoundary>
    </Fragment>
  );
};

export default BuildingTooltip;
