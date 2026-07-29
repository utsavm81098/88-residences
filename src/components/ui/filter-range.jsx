import * as React from "react";
import { useTranslation } from "react-i18next";
import { Slider } from "./slider";
import { cn } from "@/lib/utils";

function FilterRange({
  label,
  icon: Icon,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  unit = "",
  formatValue = (val) => val?.toLocaleString() ?? "",
  prefix = "",
  className,
  ...props
}) {
  const { i18n } = useTranslation();
  const displayMin = value?.[0] ?? min;
  const displayMax = value?.[1] ?? max;

  return (
    <div
      data-slot="filter-range"
      dir={i18n.dir()}
      className={cn(
        "bg-white border border-border-light rounded-[10px] p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between",
        className,
      )}
      {...props}
    >
      {label && (
        <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
          {Icon && <Icon size={16} className="text-gray-500" />}
          <label className="text-[14px] font-bold text-gray-800">{label}</label>
        </div>
      )}
      <div className="flex justify-between items-center text-[13px] font-bold text-gray-800 mb-1 sm:mb-1.5 px-0.5">
        <span>
          {prefix}
          {formatValue(displayMin)}
          {unit ? ` ${unit}` : ""}
        </span>
        <span>
          {prefix}
          {formatValue(displayMax)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="px-1 py-1">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={onValueChange}
          className="w-full"
          dir={i18n.dir()}
        />
      </div>
    </div>
  );
}

export { FilterRange };
