import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLocalizedString, extractDigit } from "@/utils/helper";
import { useTranslation } from "react-i18next";
import { UNIT_ICONS, ICON_PROPS_DEFAULT } from "@/utils/constant";
import { ICONS } from "@/assets/icons";

const ApartmentCard = ({ unit, isSelected, selectedBuilding, onEnquiry }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const isSold = unit?.status === "sold" || unit?.apartment_sold;
  const isAvailable = !isSold;

  return (
    <div
      className={`w-full snap-center bg-card-mobile border-2 ${
        isSelected ? "border-blue-500" : "border-transparent"
      } rounded-[18px] p-3 flex flex-col gap-1.5 relative transition-all active:scale-[0.98] shadow-lg shrink-0`}
    >
      <div className="flex justify-between items-center mt-0.5">
        <span className="font-extrabold text-white text-[16px] tracking-tight">
          {getLocalizedString(unit.bedrooms?.name, lang)}
        </span>
        <span className="text-white/60 font-bold text-[13px] flex items-center gap-1.5">
          {unit?.apartment_number}
        </span>
      </div>

      <div className="flex justify-between items-center w-full min-h-[32px]">
        {isSold ? (
          <Badge
            variant="sold"
            className="text-[10px] uppercase tracking-wider px-2 py-0 w-fit"
          >
            {t("sold")}
          </Badge>
        ) : (
          <>
            <span
              className="text-[18px] font-bold text-white tracking-tight leading-none"
              dir="ltr"
            >
              {unit?.apartment_price}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 gap-1.5 text-[10px] uppercase font-bold rounded-full border border-accent-yellow/30 text-accent-yellow bg-accent-yellow/5 hover:!bg-accent-yellow hover:!text-white transition-all duration-300 group shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onEnquiry?.();
              }}
            >
              <ICONS.Mail
                size={12}
                className="text-accent-yellow group-hover:text-white transition-colors"
              />
              <span>{t("enquiry")}</span>
            </Button>
          </>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="flex flex-row items-center justify-between gap-x-2 mt-0.5">
        {selectedBuilding?.name && unit?.bedrooms?.slug && (
          <div className="flex flex-col items-start gap-0 text-white">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 shrink-0 scale-90 origin-left">
                <UNIT_ICONS.aptType {...ICON_PROPS_DEFAULT} />
              </span>
              <div className="text-[13px] font-semibold leading-tight">
                {`${selectedBuilding.name} ${extractDigit(unit?.bedrooms?.slug)}`}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium normal-case">
              {t("apt_type")}
            </div>
          </div>
        )}
        {unit.bedrooms && (
          <div className="flex flex-col items-start gap-0 text-white">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 shrink-0 scale-90 origin-left">
                <UNIT_ICONS.bedrooms {...ICON_PROPS_DEFAULT} />
              </span>
              <div className="text-[13px] font-semibold leading-tight">
                {extractDigit(unit.bedrooms?.slug)}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium normal-case">
              {t("rooms")}
            </div>
          </div>
        )}
        {unit.apartment_area && (
          <div className="flex flex-col items-start gap-0 text-white">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 shrink-0 scale-90 origin-left">
                <UNIT_ICONS.area {...ICON_PROPS_DEFAULT} />
              </span>
              <div className="text-[13px] font-semibold leading-tight">
                {unit.apartment_area}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium normal-case">
              {t("area_m2")}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <Button
          variant="outline"
          className="flex-1 bg-transparent border border-white/10 text-white text-[12px] font-bold h-9 rounded-lg"
        >
          {t("floor_plan")}
        </Button>
        <Button
          variant="brand"
          className="flex-1 text-[12px] font-bold h-9 rounded-lg"
        >
          {t("view_property")}
        </Button>
      </div>
    </div>
  );
};

export default memo(ApartmentCard);
