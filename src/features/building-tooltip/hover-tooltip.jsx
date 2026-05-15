import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatCell from "@/components/ui/stat-cell";
import { getLocalizedString, extractDigit } from "@/utils/helper";
import {
  ICON_PROPS_DEFAULT,
  STATUS_CONFIG,
  UNIT_ICONS,
} from "@/utils/constant";

/**
 * HoverTooltip - Pure UI component for displaying hover details.
 * Following SOP: Presentational component, data via props.
 */
const HoverTooltip = ({
  unit,
  status,
  selectedBuilding,
  showHoverTooltip,
  hoverTooltipRef,
  t,
  lang,
}) => {
  const statusInfo = unit ? (STATUS_CONFIG[status] ?? { label: status }) : null;

  if (!unit) return null;

  return (
    <div
      ref={hoverTooltipRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9990] will-change-transform transition-opacity duration-75 ease-in-out hidden md:block`}
      style={{
        opacity: showHoverTooltip ? 1 : 0,
      }}
    >
      <Card className="!p-0 bg-card-bg/95 backdrop-blur-[16px] border border-white/10 rounded-2xl min-w-[240px] max-w-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_0.5px_rgba(255,255,255,0.04)] text-white">
        <CardContent className="px-4 py-4 flex flex-col gap-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[17px] font-bold tracking-tight">
              {unit.apartment_number || unit.title}
            </span>
            {status === "available" ? (
              <span className="text-[15px] font-bold text-white/90 tracking-tight text-start">
                <span dir="ltr">{unit.apartment_price}</span>
              </span>
            ) : (
              <Badge
                variant={status}
                className="text-[10px] uppercase tracking-wider px-2 py-0"
              >
                {statusInfo ? t(statusInfo.label) : ""}
              </Badge>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="h-[1px] bg-white/10" />

          {/* ── Building / Floor row ── */}
          {selectedBuilding?.name && unit?.floor_no?.name && (
            <div className="text-[14px] font-semibold text-slate-500 tracking-[0.1em] flex items-center gap-2">
              <span>{`${t("block")} ${selectedBuilding.name}`}</span>
              <span className="text-white/15">|</span>
              <span>{getLocalizedString(unit.floor_no?.name, lang)}</span>
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div className="flex flex-row items-center justify-between gap-x-4">
            {selectedBuilding.name && unit?.bedrooms?.slug && (
              <StatCell
                icon={<UNIT_ICONS.aptType {...ICON_PROPS_DEFAULT} />}
                value={`${selectedBuilding.name} ${extractDigit(unit?.bedrooms?.slug)}`}
                label={t("apt_type")}
              />
            )}
            {unit.bedrooms && (
              <StatCell
                icon={<UNIT_ICONS.bedrooms {...ICON_PROPS_DEFAULT} />}
                value={extractDigit(unit.bedrooms?.slug)}
                label={t("rooms")}
              />
            )}
            {unit.apartment_area && (
              <StatCell
                icon={<UNIT_ICONS.area {...ICON_PROPS_DEFAULT} />}
                value={unit.apartment_area}
                label={t("area_m2")}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(HoverTooltip);

