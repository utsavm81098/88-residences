import React from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "@/assets/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getLocalizedString } from "@/utils/helper";

const InventoryList = ({
  finalData,
  activeAccordion,
  setActiveAccordion,
  onUnitSelect,
  selectedUnit,
  handleClearFilters,
  scrollRef,
  itemRefs,
  totalApartments,
  loading,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Results Header */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
        <h3 className="text-[13px] font-bold text-white/80">
          {totalApartments} {t("apartments_found")}
        </h3>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-[35px_1fr_45px_50px_75px] gap-3 px-1 py-3 border-y bg-sidebar-bg border-s-2 border-transparent">
        <div className="flex justify-center items-center">
          <span className="text-[11px] font-bold text-white/40">#</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 text-white/40">
          <ICONS.Compass size={13} />
          <span className="text-[8px] uppercase tracking-tighter">
            {t("direction")}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 text-white/40">
          <ICONS.Bedrooms size={13} />
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            {t("rooms")}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 text-white/40">
          <ICONS.Area size={13} />
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            {t("area")}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 text-white/40">
          <span className="text-[12px] font-bold">€</span>
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            {t("price")}
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar-bg relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
            <ICONS.RotateCw
              className="animate-spin"
              size={32}
              strokeWidth={1}
            />
            <span className="text-[12px] uppercase tracking-widest animate-pulse">
              {t("loading")}...
            </span>
          </div>
        ) : (
          <Accordion
            type="multiple"
            collapsible
            className="border-none rounded-none"
            value={activeAccordion || []}
            onValueChange={setActiveAccordion}
          >
            {finalData?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
                <ICONS.Search size={32} strokeWidth={1} />
                <span className="text-[12px] uppercase tracking-widest">
                  {t("no_results_found")}
                </span>
                <Button
                  variant="link"
                  onClick={handleClearFilters}
                  className="text-accent-yellow text-[11px] h-auto p-0"
                >
                  {t("clear_all_filters")}
                </Button>
              </div>
            ) : (
              finalData.map(([building, units]) => (
                <div
                  key={building}
                  ref={(el) => (itemRefs.current[building] = el)}
                >
                  <AccordionItem value={building} className="border-none">
                    <AccordionTrigger
                      className={cn(
                        "px-5 py-3 hover:no-underline border-b border-white/5 flex justify-between text-white/90 transition-colors",
                        activeAccordion?.includes(building) &&
                          "bg-white/[0.02]",
                      )}
                    >
                      <span className="text-[12px] font-bold tracking-widest">
                        {building + " Building"}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="border-b border-white/5">
                      <div className="bg-sidebar-bg">
                        {units.map((unit, idx) => {
                          const unitId = `${building}-${unit?.apartment_number}`;
                          const isSelected =
                            selectedUnit?.id === unit.id &&
                            selectedUnit?.apartment_number ===
                              unit?.apartment_number;

                          return (
                            <div
                              key={unitId}
                              className={cn(
                                "grid grid-cols-[35px_1fr_45px_50px_75px] gap-3 px-1 py-3.5 items-center cursor-pointer transition-all border-s-2",
                                isSelected
                                  ? "bg-accent-yellow/20 border-accent-yellow text-accent-yellow"
                                  : "hover:bg-white/5 border-transparent text-white/80",
                              )}
                              onClick={() => onUnitSelect(unit)}
                            >
                              <div className="text-[12px] font-bold text-center">
                                {unit?.apartment_number || idx + 1}
                              </div>
                              <div className="text-[11px] text-center opacity-70">
                                {getLocalizedString(
                                  unit?.property_direction?.name,
                                  i18n.language,
                                ) || "Front"}
                              </div>
                              <div className="text-[11px] text-center font-bold">
                                {parseInt(
                                  getLocalizedString(
                                    unit?.bedrooms?.name,
                                    i18n.language,
                                  ),
                                ) || "1"}
                              </div>
                              <div className="text-[11px] text-center opacity-70">
                                {unit?.apartment_area || "0"}
                              </div>
                              <div className="text-[12px] font-bold text-end pe-4">
                                {unit?.apartment_sold ? (
                                  <Badge variant="sold" className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded-md">
                                    {t("sold", "Sold")}
                                  </Badge>
                                ) : (
                                  <span dir="ltr">{unit?.apartment_price || 0}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
