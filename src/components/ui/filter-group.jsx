import * as React from "react";
import { cn } from "@/lib/utils";

function FilterGroup({ label, children, className, ...props }) {
  return (
    <div
      data-slot="filter-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {label && (
        <label className="text-[13px] font-medium text-white/70">{label}</label>
      )}
      {children}
    </div>
  );
}

export { FilterGroup };
