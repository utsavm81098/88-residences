import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
    <Sheet {...{ open: isOpen, onOpenChange: (open) => !open && onClose() }}>
      <SheetContent
        {...{
          side: "bottom",
          dir: i18n.dir(),
          className:
            "h-[90vh] w-full !bg-white border-t border-gray-200 p-0 rounded-t-[20px] overflow-hidden flex flex-col z-[4000] !text-gray-900 [&>button]:!bg-gray-100 [&>button]:hover:!bg-gray-200 [&>button]:!text-gray-700 [&>button]:hover:!text-gray-900",
        }}
      >
        <SheetHeader className="px-4 sm:px-6 py-3 sm:py-4 flex flex-row items-center justify-between space-y-0 text-start border-b border-gray-100">
          <SheetTitle className="text-gray-900 text-lg sm:text-xl font-bold tracking-tight">
            {t("filter_options")}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("filter_options")}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-2.5 sm:py-4 space-y-3 sm:space-y-6 custom-scrollbar">
          <InventoryFilters
            {...{
              filters: selectedFilters,
              onFilterChange,
            }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-3 sm:gap-4">
          <Button
            variant="brand"
            className="flex-1 h-10 rounded-full font-bold text-sm active:scale-[0.98] transition-all shadow-md"
            onClick={handleApplyFilters}
          >
            {t("show_apartments")} ({filteredCount})
          </Button>
          <Button
            variant="link"
            className="text-gray-600 font-bold hover:text-gray-900 transition-colors text-[13px] px-2 uppercase tracking-wider"
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
