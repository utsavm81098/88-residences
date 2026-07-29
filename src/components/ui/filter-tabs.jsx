import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

function FilterTabs({
  value,
  onValueChange,
  options = [],
  triggerClassName,
  className,
  ...props
}) {
  const { t } = useTranslation();

  const selectedValues = React.useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value && value !== "all") return [value];
    return [];
  }, [value]);

  const handleToggle = (option) => {
    let newValues;
    if (selectedValues.includes(option)) {
      newValues = selectedValues.filter((v) => v !== option);
    } else {
      newValues = [...selectedValues, option];
    }
    onValueChange(newValues.length === 0 ? "all" : newValues);
  };

  const hasLongOption = React.useMemo(
    () => options.some((opt) => opt === "studio" || opt.length > 3),
    [options],
  );

  return (
    <div
      className={cn(
        "w-full grid gap-1.5",
        options.length === 4
          ? hasLongOption
            ? "grid-cols-[1fr_1fr_1fr_1.25fr]"
            : "grid-cols-4"
          : "grid-cols-3",
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const isSelected = selectedValues.includes(option);
        const label = t(option);
        const isLongText = label.length > 3;

        return (
          <button
            key={option}
            type="button"
            onClick={() => handleToggle(option)}
            className={cn(
              "h-7 rounded-lg transition-all flex items-center justify-center cursor-pointer px-1 whitespace-nowrap outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none",
              isLongText
                ? "text-[11.5px] font-bold tracking-tight"
                : "text-[13px] font-semibold",
              isSelected
                ? "bg-accent-yellow border border-accent-yellow text-white shadow-xs font-bold"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
              triggerClassName,
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export { FilterTabs };
