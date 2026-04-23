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
  selectedUnit,
  favorites,
  onToggleFavorite,
  sortConfig,
  onSort,
}) => {
  return (
    <div className="hidden md:flex flex-col flex-1 h-full bg-sidebar-bg border-r border-white/5 text-white overflow-hidden z-[50]">
      {/* Filters Section */}
      <div className="p-5 space-y-5">
        {/* Rooms Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/70">Rooms</label>
          <div className="flex bg-transparent rounded-[4px] border border-white/10 overflow-hidden">
            {["1", "2", "3", "4"].map((num) => (
              <Button
                key={num}
                variant="ghost"
                onClick={() => onFilterChange("rooms", num)}
                className={cn(
                  "w-10 h-8 flex items-center justify-center text-[12px] font-bold transition-colors border-r border-white/10 last:border-r-0 rounded-none",
                  filters.rooms.includes(num)
                    ? "bg-accent-yellow text-black"
                    : "text-white/60 hover:bg-white/5",
                )}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/70">Type</label>
          <div className="flex bg-transparent rounded-[4px] border border-white/10 overflow-hidden">
            {["Gdn. Apt.", "Apt.", "PH"].map((t) => (
              <Button
                key={t}
                variant="ghost"
                onClick={() => onFilterChange("type", t)}
                className={cn(
                  "px-3 h-8 flex items-center justify-center text-[11px] font-bold whitespace-nowrap transition-colors border-r border-white/10 last:border-r-0 rounded-none",
                  filters.type.includes(t)
                    ? "bg-accent-yellow text-black"
                    : "text-white/60 hover:bg-white/5",
                )}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        {/* Exposure Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/70">
            Exposure
          </label>
          <div className="flex bg-transparent rounded-[4px] border border-white/10 overflow-hidden">
            {["Pool View", "Valley View"].map((e) => (
              <Button
                key={e}
                variant="ghost"
                onClick={() => onFilterChange("exposure", e)}
                className={cn(
                  "px-4 h-8 flex items-center justify-center text-[11px] font-bold whitespace-nowrap transition-colors border-r border-white/10 last:border-r-0 rounded-none",
                  filters.exposure.includes(e)
                    ? "bg-accent-yellow text-black"
                    : "text-white/60 hover:bg-white/5",
                )}
              >
                {e === "Pool View" ? "Pool" : "Valley"}
              </Button>
            ))}
          </div>
        </div>

        {/* Clear/More Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="link"
            className="h-auto p-0 text-[11px] font-medium text-white/40 hover:text-white"
          >
            More filters
          </Button>
          <Button
            variant="link"
            onClick={handleClearFilters}
            className="h-auto p-0 text-[11px] font-bold text-white/80 uppercase tracking-widest hover:text-white"
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
        <h3 className="text-[13px] font-bold text-white/80">
          {filteredUnits.length} apartments found
        </h3>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-[40px_40px_1fr_45px_55px_75px] gap-0 px-1 py-3 border-y border-white/10 bg-sidebar-bg">
        <div className="flex justify-center items-center opacity-40">
          <ICONS.Heart size={14} />
        </div>
        <button
          onClick={() => onSort("name")}
          className="flex justify-center items-center gap-0.5 hover:text-accent-yellow transition-colors"
        >
          <span
            className={cn(
              "text-[11px] font-bold",
              sortConfig.key === "name"
                ? "text-accent-yellow"
                : "text-white/40",
            )}
          >
            #
          </span>
          {sortConfig.key === "name" && (
            <span className="text-[8px]">
              {sortConfig.direction === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
        <button
          onClick={() => onSort("direction")}
          className="flex flex-col items-center justify-center gap-0.5 hover:text-accent-yellow transition-colors"
        >
          <ICONS.Compass
            size={13}
            className={
              sortConfig.key === "direction"
                ? "text-accent-yellow"
                : "text-white/40"
            }
          />
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            Exp.
          </span>
        </button>
        <button
          onClick={() => onSort("type")}
          className="flex flex-col items-center justify-center gap-0.5 hover:text-accent-yellow transition-colors"
        >
          <ICONS.Bedrooms
            size={13}
            className={
              sortConfig.key === "type" ? "text-accent-yellow" : "text-white/40"
            }
          />
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            Rms
          </span>
        </button>
        <button
          onClick={() => onSort("area")}
          className="flex flex-col items-center justify-center gap-0.5 hover:text-accent-yellow transition-colors"
        >
          <ICONS.Area
            size={13}
            className={
              sortConfig.key === "area" ? "text-accent-yellow" : "text-white/40"
            }
          />
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            Area
          </span>
        </button>
        <button
          onClick={() => onSort("price")}
          className="flex flex-col items-center justify-center gap-0.5 hover:text-accent-yellow transition-colors"
        >
          <span
            className={cn(
              "text-[12px] font-bold",
              sortConfig.key === "price"
                ? "text-accent-yellow"
                : "text-white/40",
            )}
          >
            €
          </span>
          <span className="text-[8px] text-white/30 uppercase tracking-tighter">
            Price
          </span>
        </button>
      </div>

      {/* Accordion List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar bg-sidebar-bg"
      >
        <Accordion
          type="multiple"
          collapsible
          className="border-none rounded-none"
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
                className="px-5 py-3 hover:no-underline border-b border-white/5 flex justify-between text-white/90 transition-colors"
              >
                <span className="text-[12px] font-bold tracking-widest uppercase">
                  Block {building}
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-b border-white/5">
                <div className="bg-sidebar-bg">
                  {units.map((unit, idx) => {
                    const unitId = `${unit.buildingName}-${unit.name}`;
                    const isSelected =
                      selectedUnit?.name === unit.name &&
                      selectedUnit?.buildingName === unit.buildingName;
                    const isFavorite = favorites.includes(unitId);

                    return (
                      <div
                        key={unitId}
                        className={cn(
                          "grid grid-cols-[40px_40px_1fr_45px_55px_75px] gap-0 px-1 py-3.5 items-center cursor-pointer transition-all border-l-2",
                          isSelected
                            ? "bg-accent-yellow/20 border-accent-yellow text-accent-yellow"
                            : "hover:bg-white/5 border-transparent text-white/80",
                        )}
                        onClick={() => onUnitSelect(unit)}
                      >
                        <div className="flex justify-center items-center">
                          <button
                            onClick={(e) => onToggleFavorite(unitId, e)}
                            className="hover:scale-110 transition-transform"
                          >
                            <ICONS.Heart
                              size={15}
                              className={cn(
                                isFavorite
                                  ? "fill-red-500 text-red-500"
                                  : "text-white/20",
                              )}
                            />
                          </button>
                        </div>
                        <div className="text-[12px] font-bold text-center">
                          {unit.name?.replace(/\D/g, "") || idx + 1}
                        </div>
                        <div className="text-[11px] text-center opacity-70">
                          {unit.direction?.split("-")[0] || "Pool"}
                        </div>
                        <div className="text-[11px] text-center font-bold">
                          {unit.rooms || "1"}
                        </div>
                        <div className="text-[11px] text-center opacity-70">
                          {unit.area?.split(" ")[0] || "42.3"}
                        </div>
                        <div className="text-[12px] font-bold text-right pr-4">
                          {unit.price || "285,000"}
                        </div>
                      </div>
                    );
                  })}
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
