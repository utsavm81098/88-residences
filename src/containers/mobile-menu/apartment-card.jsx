import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocalizedString, extractDigit } from "@/utils/helper";
import { useTranslation } from "react-i18next";
import { UNIT_ICONS, ICON_PROPS_DEFAULT } from "@/utils/constant";
import { ICONS } from "@/assets/icons";
import { cn } from "@/lib/utils";

const ApartmentCard = ({ unit, isSelected, selectedBuilding }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRtl = i18n.dir() === "rtl";

  const isSold = unit?.status === "sold" || unit?.apartment_sold;

  return (
    <div
      className={cn(
        "w-full snap-center bg-white border-2 rounded-[18px] p-3 flex flex-col gap-2 relative transition-all active:scale-[0.98] shrink-0 text-gray-900",
        isSelected
          ? "border-accent-yellow ring-accent-yellow/30"
          : "border-gray-200",
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="flex justify-between items-center w-full min-h-8">
        <div className="flex items-center gap-1.5" dir="ltr">
          <span className="text-gray-900 font-bold text-[14px]">
            {unit?.apartment_number}
          </span>
          <span className="text-gray-300 text-[14px] font-medium">-</span>
          <span className="text-gray-700 font-bold text-[14px]">
            {getLocalizedString(unit.bedrooms?.name, lang)}
          </span>
        </div>
        {!isSold && unit?.apartment_floor_plan_image && (
          <Button
            variant="brand"
            className="text-[12px] font-bold h-8 px-3 rounded-lg gap-1.5 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                unit.apartment_floor_plan_image,
                "_blank",
                "noopener,noreferrer",
              );
            }}
          >
            <ICONS.FileText size={14} className="opacity-85" />
            <span>{t("floor_plan")}</span>
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center w-full h-6">
        {isSold ? (
          <Badge
            variant="sold"
            className="text-[10px] uppercase tracking-wider px-2 py-0 w-fit"
          >
            {t("sold")}
          </Badge>
        ) : (
          <span
            className="text-[16px] font-bold text-gray-900 tracking-tight leading-none"
            dir="ltr"
          >
            {unit?.apartment_price}
          </span>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="flex flex-row items-center justify-between gap-x-2">
        {unit?.property_direction?.name && (
          <div className="flex flex-col items-start gap-0 text-gray-800 text-start">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-slate-500 shrink-0 scale-90",
                  isRtl ? "origin-right" : "origin-left",
                )}
              >
                <UNIT_ICONS.direction {...ICON_PROPS_DEFAULT} />
              </span>
              <div className="text-[14px] font-semibold leading-tight">
                {getLocalizedString(unit?.property_direction?.name, lang)}
              </div>
            </div>
            <div className="text-[12px] text-slate-500 font-medium normal-case">
              {t("direction")}
            </div>
          </div>
        )}
        {unit.bedrooms && (
          <div className="flex flex-col items-center gap-0 text-gray-800 text-center">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-slate-500 shrink-0 scale-90",
                  isRtl ? "origin-right" : "origin-left",
                )}
              >
                <UNIT_ICONS.bedrooms {...ICON_PROPS_DEFAULT} />
              </span>
              <div
                className="text-[14px] font-semibold leading-tight text-gray-900"
                dir="ltr"
              >
                {extractDigit(unit.bedrooms?.slug)}
              </div>
            </div>
            <div className="text-[12px] text-slate-500 font-medium normal-case">
              {Number(extractDigit(unit.bedrooms?.slug)) === 1
                ? t("bedroom", "Bedroom")
                : t("bedrooms", "Bedrooms")}
            </div>
          </div>
        )}
        {unit.apartment_area && (
          <div className="flex flex-col items-end gap-0 text-gray-800 text-end">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-slate-500 shrink-0 scale-90",
                  isRtl ? "origin-right" : "origin-left",
                )}
              >
                <UNIT_ICONS.area {...ICON_PROPS_DEFAULT} />
              </span>
              <div
                className="text-[14px] font-semibold leading-tight"
                dir="ltr"
              >
                {unit.apartment_area}
              </div>
            </div>
            <div className="text-[12px] text-slate-500 font-medium normal-case">
              {t("area_m2")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ApartmentCard);
