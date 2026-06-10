import * as React from "react";
import { useTranslation } from "react-i18next";
import { Slider } from "./slider";

function FilterRange({
  label,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  unit = "",
  formatValue = (val) => val?.toLocaleString() ?? "",
  prefix = "",
  ...props
}) {
  const { i18n } = useTranslation();
  const displayMin = value?.[0] ?? min;
  const displayMax = value?.[1] ?? max;

  return (
    <div
      data-slot="filter-range"
      dir={i18n.dir()}
      className="flex flex-col gap-2 pt-2"
      {...props}
    >
      <label className="text-[12px] sm:text-[16px] font-medium text-white/70">
        {label}
      </label>
      <div className="flex justify-between items-center text-[12px] sm:text-[16px] font-bold text-white/60 px-1">
        <span>
          {prefix}
          {formatValue(displayMin)} {unit}
        </span>
        <span>
          {prefix}
          {formatValue(displayMax)} {unit}
        </span>
      </div>
      <div className="px-2 pt-2 pb-1">
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
