import React from "react";
import StatCell from "./stat-cell";
import UnitInfoCard from "@/containers/unit-info-card";
import useBuildingTooltip from "./use-building-tooltip";
import { ICONS } from "@/assets/icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  available: { label: "Available", color: "#22c55e" },
  sold: { label: "Sold", color: "#ef4444" },
  reserved: { label: "Reserved", color: "#f59e0b" },
};

const ICON_PROPS = { size: 15, strokeWidth: 1.8 };
const Icons = {
  aptType: <ICONS.AptType {...ICON_PROPS} />,
  bedrooms: <ICONS.Bedrooms {...ICON_PROPS} />,
  area: <ICONS.Area {...ICON_PROPS} />,
  balcony: <ICONS.Balcony {...ICON_PROPS} />,
  type: <ICONS.Type {...ICON_PROPS} />,
  price: <ICONS.Price {...ICON_PROPS} />,
  direction: <ICONS.Compass {...ICON_PROPS} />,
};

const BuildingTooltip = () => {
  const {
    unit,
    selectedUnit,
    showHoverTooltip,
    desktopPopupRef,
    hoverTooltipRef,
  } = useBuildingTooltip();

  const statusInfo = unit
    ? (STATUS_CONFIG[unit.status] ?? { label: unit.status, color: "#94a3b8" })
    : null;

  return (
    <>
      {/* ── Desktop Hover Tooltip (Hidden on mobile) ── */}
      <div
        ref={hoverTooltipRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9990] will-change-transform transition-opacity duration-75 ease-in-out hidden md:block`}
        style={{
          opacity: showHoverTooltip ? 1 : 1,
        }}
      >
        {unit && (
          <Card className="!p-0 bg-card-bg/95 backdrop-blur-[16px] border border-white/10 rounded-2xl min-w-[240px] max-w-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_0.5px_rgba(255,255,255,0.04)] text-white">
            <CardContent className="px-4 py-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[17px] font-bold tracking-tight">
                  {unit.name}
                </span>
                <Badge
                  variant={
                    unit.status === "available"
                      ? "success"
                      : unit.status === "sold"
                        ? "destructive"
                        : "warning"
                  }
                  className="text-[10px] uppercase tracking-wider px-2 py-0"
                >
                  {statusInfo?.label}
                </Badge>
              </div>

              {/* ── Divider ── */}
              <div className="h-[1px] bg-white/10 mb-2" />

              {/* ── Building / Floor row ── */}
              {(unit.building || unit.floor) && (
                <div className="text-[11px] font-semibold text-slate-500 tracking-[0.1em] uppercase mb-2 flex items-center gap-2">
                  {unit.building && <span>{unit.building}</span>}
                  {unit.building && unit.floor && (
                    <span className="text-white/15">|</span>
                  )}
                  {unit.floor && (
                    <span>
                      {unit.floor}
                      <sup className="text-[8px] ml-0.5">th</sup> floor
                    </span>
                  )}
                </div>
              )}

              {/* ── Stats Grid ── */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {unit.aptType && (
                  <StatCell
                    icon={Icons.aptType}
                    value={unit.aptType}
                    label="apt. type"
                  />
                )}
                {unit.bedrooms && (
                  <StatCell
                    icon={Icons.bedrooms}
                    value={unit.bedrooms}
                    label="bedrooms"
                  />
                )}
                {unit.area && (
                  <StatCell icon={Icons.area} value={unit.area} label="area" />
                )}
                {unit.balcony && (
                  <StatCell
                    icon={Icons.balcony}
                    value={unit.balcony}
                    label="balcony, m²"
                  />
                )}
                {unit.type && (
                  <StatCell icon={Icons.type} value={unit.type} label="type" />
                )}
                {unit.direction && (
                  <StatCell
                    icon={Icons.direction}
                    value={unit.direction}
                    label="direction"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Desktop Top-Right Popup (Hidden on mobile) ── */}
      <div
        ref={desktopPopupRef}
        className={`fixed ltr:right-6 rtl:left-6 top-24 z-[9999] w-[260px] hidden md:block ${selectedUnit ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}
      >
        {selectedUnit && <UnitInfoCard unit={selectedUnit} />}
      </div>
    </>
  );
};

export default BuildingTooltip;
