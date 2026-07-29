import * as React from "react";
import { cn } from "@/lib/utils";

function FilterGroup({ label, icon: Icon, children, className, labelClassName, ...props }) {
  return (
    <div
      data-slot="filter-group"
      className={cn(
        "bg-white border border-border-light rounded-[10px] p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between",
        className,
      )}
      {...props}
    >
      {label && (
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          {Icon && <Icon size={16} className="text-gray-500" />}
          <label className={cn("text-[14px] font-bold text-gray-800", labelClassName)}>
            {label}
          </label>
        </div>
      )}
      {children}
    </div>
  );
}

export { FilterGroup };
