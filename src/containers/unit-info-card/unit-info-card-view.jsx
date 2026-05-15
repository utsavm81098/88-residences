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
          className="absolute -top-3 -right-3 z-[50] bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md text-white border border-white/10 shadow-lg"
        >
          <ICONS.X size={14} />
        </Button>
      )}

      <Card className="flex flex-col gap-4 bg-card-bg/95 !p-0 backdrop-blur-xl border border-white/10 w-full overflow-hidden text-white shadow-2xl rounded-2xl">
        <CardHeader className="px-3.5 pt-4 pb-0 space-y-0.5">
          <div className="flex justify-between items-center gap-2">
            <span className="text-lg font-bold tracking-tight truncate">
              {t("apt")} {unit.apartment_number || unit.title || unit.name}
            </span>
            <div className="flex items-center gap-2">
              {status !== "sold" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 gap-2 text-[11px] uppercase font-bold rounded-full border border-accent-yellow/30 text-accent-yellow bg-accent-yellow/5 hover:!bg-accent-yellow hover:!text-white transition-all duration-300 group shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEnquiry();
                  }}
                >
                  <ICONS.Mail
                    size={14}
                    className="text-accent-yellow group-hover:text-white transition-colors"
                  />
                  <span>{t("enquiry")}</span>
                </Button>
              )}
              {status === "sold" && (
                <Badge
                  variant="sold"
                  className="text-[10px] uppercase px-2 py-0"
                >
                  {t("sold")}
                </Badge>
              )}
            </div>
          </div>
          {status !== "sold" && unit.apartment_price && (
            <div className="text-white/90 font-bold text-lg text-start">
              <span dir="ltr">{unit.apartment_price}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-3.5 flex flex-col gap-y-4">
          <div className="h-[1px] bg-white/10" />
          {selectedBuilding?.name && unit?.floor_no?.name && (
            <div className="text-[14px] font-semibold text-slate-500 tracking-[0.1em] flex items-center gap-2">
              <span>{`${t("block")} ${selectedBuilding.name}`}</span>
              <span className="text-white/15">|</span>
              <span>{getLocalizedString(unit.floor_no?.name, lang)}</span>
            </div>
          )}

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

        <CardFooter className="px-3.5 pb-4 flex gap-2">
          <Button
            variant="brand"
            className="flex-1 font-bold h-10 rounded-lg text-[13px] transition-colors"
          >
            {t("view_property")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-lg text-[13px] border-white/10 text-white/90 hover:bg-white/5 uppercase tracking-wider"
          >
            {t("floor_plan")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UnitInfoCardView;
