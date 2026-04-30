import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import InventoryFilters from "@/containers/inventory-sidebar/components/inventory-filters";
import useFilterOverlay from "./use-filter-overlay";

const FilterOverlay = memo(({ isOpen, onClose }) => {
  const {
    selectedFilters,
    onFilterChange,
    handleClearAll,
    handleApplyFilters,
    filteredCount,
  } = useFilterOverlay({ isOpen, onClose });

  const { t, i18n } = useTranslation();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        dir={i18n.dir()}
        className="h-[90vh] w-full bg-sidebar border-none p-0 rounded-t-[20px] overflow-hidden flex flex-col z-[4000]"
      >
        <SheetHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0 text-start">
          <SheetTitle className="text-white text-xl font-bold tracking-tight">
            {t("filter_options")}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 custom-scrollbar">
          <InventoryFilters
            filters={selectedFilters}
            onFilterChange={onFilterChange}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-sidebar border-t border-white/5 flex items-center gap-4">
          <Button
            className="flex-1 h-12 rounded-full bg-white text-black font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl"
            onClick={handleApplyFilters}
          >
            {t("show_apartments")} ({filteredCount})
          </Button>
          <Button
            variant="link"
            className="text-white/60 font-bold hover:text-white transition-colors text-[13px] px-2 uppercase tracking-wider"
            onClick={handleClearAll}
          >
            {t("clear_all")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

export default FilterOverlay;
