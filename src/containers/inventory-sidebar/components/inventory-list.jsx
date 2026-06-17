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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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

      <Table
        className="w-full flex-1 flex flex-col overflow-hidden"
        containerClassName="flex-1 flex flex-col overflow-hidden"
      >
        {/* Table Headers */}
        <TableHeader className="border-none block bg-sidebar-bg border-y border-white/5">
          <TableRow className="flex gap-3 px-2 py-3 border-none hover:bg-transparent items-center border-s-2 border-transparent">
            <TableHead className="w-[35px] shrink-0 flex justify-center items-center text-white/40 h-auto p-0 border-none font-bold">
              <span className="text-[16px] font-bold text-white/40">#</span>
            </TableHead>
            <TableHead className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-white/40 h-auto p-0 border-none">
              <ICONS.Compass size={13} />
              <span className="text-[10px] uppercase tracking-tighter">
                {t("direction")}
              </span>
            </TableHead>
            <TableHead className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-white/40 h-auto p-0 border-none">
              <ICONS.Bedrooms size={13} />
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                {t("bedrooms")}
              </span>
            </TableHead>
            <TableHead className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-white/40 h-auto p-0 border-none">
              <ICONS.Area size={13} />
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                {t("area")}
              </span>
            </TableHead>
            <TableHead className="w-[80px] shrink-0 flex flex-col items-center justify-center gap-0.5 text-white/40 h-auto p-0 border-none">
              <span className="text-[12px] font-bold">€</span>
              <span className="text-[10px] text-white/30 uppercase tracking-tighter">
                {t("price")}
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* Table Body containing Accordion */}
        <TableBody
          ref={scrollRef}
          className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar-bg block relative"
        >
          {loading ? (
            <TableRow className="block border-none hover:bg-transparent">
              <TableCell className="block p-0 border-none w-full" colSpan={5}>
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
              </TableCell>
            </TableRow>
          ) : (
            <TableRow className="block border-none hover:bg-transparent">
              <TableCell className="block p-0 border-none w-full" colSpan={5}>
                <Accordion
                  type="multiple"
                  className="border-none rounded-none block w-full"
                  value={activeAccordion || []}
                  onValueChange={setActiveAccordion}
                >
                  {finalData?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
                      <ICONS.Search size={32} strokeWidth={1} />
                      <span className="text-[16px] uppercase tracking-widest">
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
                        className="block"
                      >
                        <AccordionItem
                          value={building}
                          className="border-none block"
                        >
                          <AccordionTrigger
                            className={cn(
                              "px-2 py-3 hover:no-underline border-b border-white/5 flex justify-between text-white/90 transition-colors",
                              activeAccordion?.includes(building) &&
                                "bg-white/[0.02]",
                            )}
                          >
                            <span className="text-[14px] font-bold tracking-widest">
                              {building + " " + t("building")}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="border-b border-white/5 pb-0">
                            {units.map((unit, idx) => {
                              const unitId = `${building}-${unit?.apartment_number}`;
                              const isSelected =
                                selectedUnit?.id === unit.id &&
                                selectedUnit?.apartment_number ===
                                  unit?.apartment_number;

                              return (
                                <TableRow
                                  key={unitId}
                                  as="div"
                                  className={cn(
                                    "flex gap-3 px-2 py-3.5 items-center cursor-pointer transition-all border-s-2",
                                    isSelected
                                      ? "bg-accent-yellow/20 border-s-accent-yellow text-accent-yellow border-t-transparent hover:bg-accent-yellow/20"
                                      : "hover:bg-white/5 border-transparent text-white/80",
                                  )}
                                  onClick={() => onUnitSelect(unit)}
                                >
                                  <TableCell
                                    as="div"
                                    className="w-[35px] shrink-0 text-[16px] font-bold text-center p-0 flex items-center justify-center h-auto border-none"
                                  >
                                    {unit?.apartment_number || idx + 1}
                                  </TableCell>
                                  <TableCell
                                    as="div"
                                    className="flex-1 min-w-0 text-[16px] text-center opacity-70 p-0 flex items-center justify-center h-auto border-none"
                                  >
                                    {getLocalizedString(
                                      unit?.property_direction?.name,
                                      i18n.language,
                                    ) || "Front"}
                                  </TableCell>
                                  <TableCell
                                    as="div"
                                    className="flex-1 min-w-0 text-[16px] text-center font-bold p-0 flex items-center justify-center h-auto border-none"
                                  >
                                    {parseInt(
                                      getLocalizedString(
                                        unit?.bedrooms?.name,
                                        i18n.language,
                                      ),
                                    ) || "1"}
                                  </TableCell>
                                  <TableCell
                                    as="div"
                                    className="flex-1 min-w-0 text-[16px] text-center opacity-70 p-0 flex items-center justify-center h-auto border-none"
                                  >
                                    {unit?.apartment_area || "0"}
                                  </TableCell>
                                  <TableCell
                                    as="div"
                                    className="w-[80px] shrink-0 text-[16px] font-bold p-0 flex items-center justify-center h-auto border-none"
                                  >
                                    {unit?.apartment_sold ? (
                                      <Badge
                                        variant="sold"
                                        className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded-md"
                                      >
                                        {t("sold", "Sold")}
                                      </Badge>
                                    ) : (
                                      <span dir="ltr">
                                        {unit?.apartment_price || 0}
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </AccordionContent>
                        </AccordionItem>
                      </div>
                    ))
                  )}
                </Accordion>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryList;
