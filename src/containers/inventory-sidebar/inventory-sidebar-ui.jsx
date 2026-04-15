import { ICONS } from "@/assets/icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

const InventorySidebar = ({
  activeAccordion,
  setActiveAccordion,
  filters,
  filteredUnits,
  groupedUnits,
  handleClearFilters,
  onUnitSelect,
  onFilterChange,
  scrollContainerRef,
}) => {
  return (
    <div className="hidden md:flex flex-col w-[380px] h-full bg-sidebar border-r border-white/10 text-white overflow-hidden z-[50]">
      {/* Filters Section */}
      <div className="p-6 space-y-6">
        {/* Rooms Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">Rooms</label>
          <div className="flex bg-transparent rounded-[3px] border border-filter-border overflow-hidden">
            {["1", "2", "3", "4"].map((num) => (
              <Button
                key={num}
                variant="ghost"
                onClick={() => onFilterChange("rooms", num)}
                className={cn(
                  "w-10 h-8 flex items-center justify-center text-[13px] font-medium transition-colors border-r border-filter-border last:border-r-0 rounded-none",
                  filters.rooms.includes(num)
                    ? "bg-filter-active text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-filter-hover",
                )}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">Type</label>
          <div className="flex bg-transparent rounded-[3px] border border-filter-border overflow-hidden">
            {["Gdn. Apt.", "Apt.", "PH"].map((t) => (
              <Button
                key={t}
                variant="ghost"
                onClick={() => onFilterChange("type", t)}
                className={cn(
                  "px-3 h-8 flex items-center justify-center text-[13px] font-medium whitespace-nowrap transition-colors border-r border-filter-border last:border-r-0 rounded-none",
                  filters.type.includes(t)
                    ? "bg-filter-active text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-filter-hover",
                )}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Exposure Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">
            Exposure
          </label>
          <div className="flex bg-transparent rounded-[3px] border border-filter-border overflow-hidden">
            {["Pool View", "Valley View"].map((e) => (
              <Button
                key={e}
                variant="ghost"
                onClick={() => onFilterChange("exposure", e)}
                className={cn(
                  "px-3 h-9 flex flex-col items-center justify-center text-[11px] font-medium leading-[1.1] transition-colors text-center border-r border-filter-border last:border-r-0 rounded-none",
                  filters.exposure.includes(e)
                    ? "bg-filter-active text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-filter-hover",
                )}
              >
                <span>{e.split(" ")[0]}</span>
                <span>{e.split(" ")[1]}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Clear/More Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button 
            variant="link" 
            className="h-auto p-0 text-[12px] font-medium text-white/80 hover:text-white"
          >
            More filters
          </Button>
          <Button
            variant="link"
            onClick={handleClearFilters}
            className="h-auto p-0 text-[12px] font-bold text-white uppercase tracking-wider"
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-6 py-4">
        <h3 className="text-[15px] font-bold text-white/95">
          {filteredUnits.length} available apartments found
        </h3>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-[40px_40px_1fr_60px_60px_80px] gap-0 px-2 py-3 border-y border-white/10 bg-sidebar">
        <div className="flex justify-center items-center">
          <ICONS.Heart size={15} className="text-white/90" strokeWidth={1.5} />
        </div>
        <div className="flex justify-center items-center gap-1">
          <span className="text-[12px] text-amber-400 font-bold">↑</span>
          <span className="text-[12px] text-amber-400 font-bold">#</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <ICONS.Compass size={14} className="text-white/80" strokeWidth={1.5} />
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Exposure
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <ICONS.Bedrooms size={14} className="text-white/80" strokeWidth={1.5} />
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Rooms
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <ICONS.Area size={14} className="text-white/80" strokeWidth={1.5} />
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Area
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <span className="text-[14px] text-white/80 font-medium leading-none">
            €
          </span>
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Price
          </span>
        </div>
      </div>

      {/* Accordion List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar"
      >
        <Accordion
          type="multiple"
          collapsible
          className="border-none"
          value={activeAccordion}
          onValueChange={setActiveAccordion}
        >
          {Object.entries(groupedUnits).map(([building, units]) => (
            <AccordionItem
              key={building}
              value={building}
              className="border-none"
            >
              <AccordionTrigger 
                data-building={building}
                className="px-6 py-3.5 hover:no-underline bg-sidebar border-b border-sidebar-border flex justify-between text-white transition-colors"
              >
                <span className="text-[13px] font-medium tracking-wide">
                  building {building}
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-b border-white/5">
                <div className="bg-sidebar">
                  {units.map((unit, idx) => (
                    <div
                      key={`${building}-${unit.name}-${idx}`}
                      className="grid grid-cols-[40px_40px_1fr_60px_60px_80px] gap-0 px-2 py-3 items-center hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => onUnitSelect(unit)}
                    >
                      <div className="flex justify-center items-center">
                        <ICONS.Heart
                          size={16}
                          strokeWidth={1.5}
                          className={cn(
                            "text-red-500",
                            unit.status === "sold"
                              ? "fill-red-500"
                              : "fill-transparent",
                          )}
                        />
                      </div>
                      <div className="text-[13px] font-bold text-center text-white/90">
                        {unit.name?.replace(/\D/g, "") || idx + 1}
                      </div>
                      <div className="text-[13px] text-white/90 text-center font-medium">
                        {unit.direction?.split("-")[0] || "Pool"}
                      </div>
                      <div className="text-[13px] text-white/90 text-center font-medium">
                        {unit.type?.charAt(0) || "2"}
                      </div>
                      <div className="text-[13px] text-white/90 text-center font-medium">
                        {unit.area?.split(" ")[0] || "79"}
                      </div>
                      <div className="text-[13px] font-medium text-white/90 text-right pr-4">
                        {unit.price?.replace(/[^\d,]/g, "") || "475,875"}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default InventorySidebar;


