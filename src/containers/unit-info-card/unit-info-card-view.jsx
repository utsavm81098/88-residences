import React from "react";
import { ICONS } from "@/assets/icons";
import StatCell from "@/components/ui/stat-cell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UNIT_ICONS, ICON_PROPS_DEFAULT } from "@/utils/constant";
import { extractDigit, getLocalizedString } from "@/utils/helper";

/**
 * UnitInfoCardView - Pure UI component for displaying unit details.
 * Following SOP: Pure presentational component.
 */
const UnitInfoCardView = ({
  unit,
  selectedBuilding,
  t,
  lang,
  status,
  handleClose,
  isEnquiryOpen,
  openEnquiry,
  setEnquiryOpen,
}) => {
  if (!unit) return null;

  return (
    <div className="relative w-full pointer-events-auto">
      {handleClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-[50] bg-white hover:!bg-gray-100 active:!bg-gray-200 rounded-full text-gray-600 hover:!text-gray-900 border border-gray-200 hover:border-gray-300 shadow-md transition-all cursor-pointer"
        >
          <ICONS.X size={14} />
        </Button>
      )}

      <Card className="flex flex-col gap-4 !bg-white !p-0 !px-3.5 !py-4 ring-0 border border-gray-200 w-full overflow-hidden !text-gray-900 shadow-2xl rounded-2xl">
        <CardHeader className="px-0 pb-0 space-y-0.5">
          <div className="flex justify-between items-center gap-2">
            <span className="text-lg font-bold tracking-tight truncate text-gray-900">
              {t("apt")} {unit.apartment_number || unit.title || unit.name}
            </span>
            <div className="flex items-center gap-2">
              {unit?.apartment_floor_plan_image && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 gap-2 text-[11px] uppercase font-bold rounded-full border border-accent-yellow/30 text-accent-yellow bg-accent-yellow/5 hover:!bg-accent-yellow hover:!text-white transition-all duration-300 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      unit.apartment_floor_plan_image,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  }}
                >
                  <ICONS.FileText
                    size={14}
                    className="text-accent-yellow group-hover:text-white transition-colors"
                  />
                  <span>{t("floor_plan")}</span>
                </Button>
              )}
            </div>
          </div>
          {status !== "sold" && unit.apartment_price && (
            <div className="text-gray-800 font-bold text-lg text-start">
              <span dir="ltr">{unit.apartment_price}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-0 flex flex-col gap-y-4">
          <div className="h-[1px] bg-border-light" />
          {selectedBuilding?.name && unit?.floor_no?.name && (
            <div className="text-[14px] font-semibold text-slate-500 tracking-[0.1em] flex items-center gap-2">
              <span>{`${t("block")} ${selectedBuilding.name}`}</span>
              <span className="text-gray-300">|</span>
              <span>{getLocalizedString(unit.floor_no?.name, lang)}</span>
            </div>
          )}

          <div className="flex flex-row items-center justify-between gap-x-4">
            {unit?.property_direction?.name && (
              <StatCell
                icon={<UNIT_ICONS.direction {...ICON_PROPS_DEFAULT} />}
                value={getLocalizedString(unit?.property_direction?.name, lang)}
                label={t("direction")}
              />
            )}
            {unit.bedrooms && (
              <StatCell
                icon={<UNIT_ICONS.bedrooms {...ICON_PROPS_DEFAULT} />}
                value={extractDigit(unit.bedrooms?.slug)}
                label={
                  Number(extractDigit(unit.bedrooms?.slug)) === 1
                    ? t("bedroom")
                    : t("bedrooms")
                }
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

        <CardFooter className="px-0 flex gap-2">
          {status !== "sold" ? (
            <Button
              variant="brand"
              className="flex-1 font-bold h-10 rounded-lg text-[13px] transition-colors gap-1.5 cursor-pointer group"
              onClick={(e) => {
                e.stopPropagation();
                openEnquiry();
              }}
            >
              <ICONS.Mail
                size={16}
                className="opacity-85 pointer-events-none group-hover:text-accent-yellow transition-colors"
              />
              <span className="pointer-events-none group-hover:text-accent-yellow transition-colors">
                {t("enquiry")}
              </span>
            </Button>
          ) : (
            <Badge
              variant="sold"
              className="w-full justify-center text-center font-bold h-10 rounded-lg text-[13px] uppercase tracking-wider py-0"
            >
              {t("sold")}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnitInfoCardView;
