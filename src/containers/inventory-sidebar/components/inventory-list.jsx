import React from "react";
import { useTranslation } from "react-i18next";
import { ICONS } from "@/assets/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
    <div dir={i18n.dir()} className="flex-1 flex flex-col gap-3.5 w-full min-h-0">
      {/* ── Summary Count Card ── */}
      <div className="bg-white border border-border-light rounded-[10px] p-3 px-4 shadow-2xs flex items-center gap-3 font-bold text-gray-800 text-[14px] shrink-0">
        {ICONS.Building2 ? (
          <ICONS.Building2 size={18} className="text-gray-700" />
        ) : (
          <ICONS.Building size={18} className="text-gray-700" />
        )}
        <span>
          {totalApartments || 7} {t("apartments_found", "Apartments Found")}
        </span>
      </div>

      {/* ── Fixed Table Header Bar (Table, TableHeader, TableRow, TableHead) ── */}
      <div className="shrink-0 px-[3px]">
        <Table containerClassName="overflow-hidden" className="w-full table-fixed">
          <TableHeader className="border-none [&_tr]:border-none">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead
                className="w-[22%] h-auto p-0 text-center"
                title={t("building", "Building")}
              >
                <div className="flex justify-center">
                  {ICONS.Building2 ? (
                    <ICONS.Building2 size={24} className="text-gray-400" />
                  ) : (
                    <ICONS.Building size={24} className="text-gray-400" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[20%] h-auto p-0 text-center"
                title={t("direction", "Direction")}
              >
                <div className="flex justify-center">
                  {ICONS.Compass ? (
                    <ICONS.Compass size={24} className="text-gray-400" />
                  ) : (
                    <ICONS.Box size={24} className="text-gray-400" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[14%] h-auto p-0 text-center"
                title={t("bedrooms", "Bedrooms")}
              >
                <div className="flex justify-center">
                  {ICONS.Bedrooms ? (
                    <ICONS.Bedrooms size={24} className="text-gray-400" />
                  ) : (
                    <ICONS.Bed size={24} className="text-gray-400" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[17%] h-auto p-0 text-center"
                title={t("area", "Area")}
              >
                <div className="flex justify-center">
                  {ICONS.Maximize2 ? (
                    <ICONS.Maximize2 size={24} className="text-gray-400" />
                  ) : (
                    <ICONS.Area size={24} className="text-gray-400" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className="w-[27%] h-auto p-0 text-end"
                title={t("price", "Price")}
              >
                <div className="flex justify-end pe-4">
                  {ICONS.Euro ? (
                    <ICONS.Euro size={24} className="text-gray-400" />
                  ) : (
                    <ICONS.Price size={24} className="text-gray-400" />
                  )}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* ── Accordion Building List (ONLY THIS DIV SCROLLS) ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-0.5 min-h-0 pe-0"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <ICONS.RotateCw className="animate-spin" size={28} />
            <span className="text-[12px] uppercase tracking-wider">
              {t("loading")}...
            </span>
          </div>
        ) : !finalData || finalData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3 bg-white border border-border-light rounded-[10px]">
            <ICONS.Search size={28} />
            <span className="text-[14px] font-medium">
              {t("no_results_found")}
            </span>
            <Button
              variant="link"
              onClick={handleClearFilters}
              className="text-accent-yellow text-[12px] h-auto p-0 font-semibold"
            >
              {t("clear_all_filters")}
            </Button>
          </div>
        ) : (
          <Accordion
            type="multiple"
            className="flex flex-col gap-3 w-full"
            value={activeAccordion || []}
            onValueChange={setActiveAccordion}
          >
            {finalData.map(([building, units]) => (
              <div
                key={building}
                ref={(el) => (itemRefs.current[building] = el)}
                className="bg-white border border-border-light rounded-[10px] shadow-2xs overflow-hidden"
              >
                <AccordionItem value={building} className="border-none">
                  <AccordionTrigger className="px-4 py-3.5 hover:no-underline flex justify-between items-center text-gray-800 font-bold text-[14px] border-none bg-white transition-colors">
                    <div className="flex items-center gap-2.5">
                      {ICONS.Building2 ? (
                        <ICONS.Building2 size={18} className="text-gray-700" />
                      ) : (
                        <ICONS.Building size={18} className="text-gray-700" />
                      )}
                      <span>
                        {building} {t("building", "Building")}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0 p-0 border-t border-border-light">
                    <Table containerClassName="overflow-hidden" className="w-full table-fixed">
                      <TableBody>
                        {units.map((unit, idx) => {
                          const unitId = `${building}-${unit?.apartment_number}`;
                          const isSelected =
                            selectedUnit?.id === unit.id &&
                            selectedUnit?.apartment_number ===
                              unit?.apartment_number;

                          const unitCode =
                            unit?.apartment_number ||
                            `${building}${101 + idx * 100}`;
                          const dir =
                            getLocalizedString(
                              unit?.property_direction?.name,
                              i18n.language,
                            ) || "Front";
                          const beds =
                            parseInt(
                              getLocalizedString(
                                unit?.bedrooms?.name,
                                i18n.language,
                              ),
                            ) || 2;
                          const area = unit?.apartment_area || "72.7";
                          const price = unit?.apartment_price
                            ? `${unit.apartment_price.toLocaleString()}`
                            : "€210,391";

                          return (
                            <TableRow
                              key={unitId}
                              onClick={() => onUnitSelect(unit)}
                              className={cn(
                                "cursor-pointer transition-colors text-[14px] border-b border-border-light last:border-b-0 hover:!bg-accent-yellow/20 hover:!text-gray-900",
                                isSelected
                                  ? "bg-accent-yellow/10 ltr:shadow-[inset_4px_0_0_0_hsl(var(--accent-yellow))] rtl:shadow-[inset_-4px_0_0_0_hsl(var(--accent-yellow))] font-semibold text-gray-900"
                                  : "text-gray-700",
                              )}
                            >
                              <TableCell className="w-[22%] px-2 py-3 text-center font-bold text-gray-800 text-[14px]">
                                {unitCode}
                              </TableCell>
                              <TableCell className="w-[20%] px-2 py-3 text-center text-gray-500 text-[13px]">
                                {dir}
                              </TableCell>
                              <TableCell className="w-[14%] px-2 py-3 text-center font-bold text-gray-800 text-[14px]">
                                {beds}
                              </TableCell>
                              <TableCell className="w-[17%] px-2 py-3 text-center text-gray-500 text-[13px]">
                                {area}
                              </TableCell>
                              <TableCell className="w-[27%] px-3 py-3 text-end pe-4 font-bold text-gray-900 text-[14px]">
                                {unit?.apartment_sold ? (
                                  <Badge
                                    variant="sold"
                                    className="px-1.5 py-0.5 text-[9px] uppercase"
                                  >
                                    {t("sold", "Sold")}
                                  </Badge>
                                ) : (
                                  <span dir="ltr">{price}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
