import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IconHeart,
  IconArrowUpRight,
  IconCompass,
  IconBed,
  IconDimensions,
  IconCoinMonero,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import { unitData } from "../../../utils/constant";
import { setSelectedUnit } from "../../../redux/reducers/buildingSlice";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";
import { Tabs, TabsList, TabsTrigger } from "../tabs";
import { cn } from "@/lib/utils";

const InventorySidebar = () => {
  const [activeAccordion, setActiveAccordion] = useState("Type F");
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    rooms: "all",
    type: "all",
    exposure: "all",
  });

  // Flat list of all units from all buildings for filtering
  const allUnits = useMemo(() => {
    return Object.entries(unitData).flatMap(([buildingName, units]) => {
      if (!Array.isArray(units)) return [];
      return units.map((unit) => ({ ...unit, buildingName }));
    });
  }, []);

  // Filter logic
  const filteredUnits = useMemo(() => {
    return allUnits.filter((unit) => {
      const roomMatch =
        filters.rooms === "all" || unit.type?.startsWith(filters.rooms);
      const typeMatch = filters.type === "all" || unit.status === filters.type; // Adjust based on your 'Type' needs
      const exposureMatch =
        filters.exposure === "all" ||
        unit.direction?.includes(filters.exposure);
      return roomMatch && typeMatch && exposureMatch;
    });
  }, [allUnits, filters]);

  // Group filtered units by building for Accordion
  const groupedUnits = useMemo(() => {
    return filteredUnits.reduce((acc, unit) => {
      const group = unit.buildingName;
      if (!acc[group]) acc[group] = [];
      acc[group].push(unit);
      return acc;
    }, {});
  }, [filteredUnits]);

  const handleClearFilters = () => {
    setFilters({ rooms: "all", type: "all", exposure: "all" });
  };

  return (
    <div className="hidden md:flex flex-col w-[380px] h-full bg-[#1f2530] border-r border-white/10 text-white overflow-hidden z-[50]">
      {/* Filters Section */}
      <div className="p-6 space-y-6">
        {/* Rooms Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">Rooms</label>
          <div className="flex bg-transparent rounded-[3px] border border-[#555] overflow-hidden">
            {["1", "2", "3", "4"].map((num) => (
              <button
                key={num}
                onClick={() => setFilters((f) => ({ ...f, rooms: num }))}
                className={cn(
                  "w-10 h-8 flex items-center justify-center text-[13px] font-medium transition-colors border-r border-[#555] last:border-r-0",
                  filters.rooms === num
                    ? "bg-[#525252] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-[#444]",
                )}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">Type</label>
          <div className="flex bg-transparent rounded-[3px] border border-[#555] overflow-hidden">
            {["Gdn. Apt.", "Apt.", "PH"].map((t) => (
              <button
                key={t}
                onClick={() => setFilters((f) => ({ ...f, type: t }))}
                className={cn(
                  "px-3 h-8 flex items-center justify-center text-[13px] font-medium whitespace-nowrap transition-colors border-r border-[#555] last:border-r-0",
                  filters.type === t
                    ? "bg-[#525252] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-[#444]",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Exposure Filter */}
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-medium text-white/90">
            Exposure
          </label>
          <div className="flex bg-transparent rounded-[3px] border border-[#555] overflow-hidden">
            {["Pool View", "Valley View"].map((e) => (
              <button
                key={e}
                onClick={() => setFilters((f) => ({ ...f, exposure: e }))}
                className={cn(
                  "px-3 h-9 flex items-center justify-center text-[11px] font-medium leading-[1.1] transition-colors text-center border-r border-[#555] last:border-r-0",
                  filters.exposure === e
                    ? "bg-[#525252] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                    : "text-white/70 hover:bg-[#444]",
                )}
              >
                {e.split(" ")[0]}
                <br />
                {e.split(" ")[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Clear/More Actions */}
        <div className="flex items-center justify-between pt-1">
          <button className="text-[12px] font-medium text-white/80 hover:underline underline-offset-2">
            More filters
          </button>
          <button
            onClick={handleClearFilters}
            className="text-[12px] font-bold text-white hover:underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="px-6 py-4">
        <h3 className="text-[15px] font-bold text-white/95">
          {filteredUnits.length} available apartments found
        </h3>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-[40px_40px_1fr_60px_60px_80px] gap-0 px-2 py-3 border-y border-white/10 bg-[#1f2530]">
        <div className="flex justify-center items-center">
          <IconHeart size={15} className="text-white/90" stroke={1.5} />
        </div>
        <div className="flex justify-center items-center gap-1">
          <span className="text-[12px] text-[#fbbf24] font-bold">↑</span>
          <span className="text-[12px] text-[#fbbf24] font-bold">#</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <IconCompass size={14} className="text-white/80" stroke={1.5} />
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Exposure
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <IconBed size={14} className="text-white/80" stroke={1.5} />
          <span className="text-[9px] text-white/60 lowercase tracking-wide">
            Rooms
          </span>
        </div>
        <div className="flex flex-col items-center justify-center gap-[2px]">
          <IconDimensions size={14} className="text-white/80" stroke={1.5} />
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
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1f2530]">
        <Accordion
          type="single"
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
              <AccordionTrigger className="px-6 py-3.5 hover:no-underline bg-[#1f2530] border-b border-[#383838] flex justify-between text-white transition-colors">
                <span className="text-[13px] font-medium tracking-wide">
                  building {building}
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-b border-white/5">
                <div className="bg-[#1f2530]">
                  {units.map((unit, idx) => (
                    <div
                      key={`${building}-${unit.name}-${idx}`}
                      className="grid grid-cols-[40px_40px_1fr_60px_60px_80px] gap-0 px-2 py-3 items-center hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => dispatch(setSelectedUnit(unit))}
                    >
                      <div className="flex justify-center items-center">
                        <IconHeart
                          size={16}
                          stroke={1.5}
                          className={cn(
                            "text-[#ef4444]",
                            unit.status === "sold"
                              ? "fill-[#ef4444]"
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
