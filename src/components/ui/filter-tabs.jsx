import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function FilterTabs({
  value,
  onValueChange,
  options,
  triggerClassName,
  ...props
}) {
  const { t, i18n } = useTranslation();

  // Ensure we have an array for multiple selection
  const selectedValues = React.useMemo(() => {
    if (Array.isArray(value)) return value;
    if (value && value !== "all") return [value];
    return [];
  }, [value]);

  const handleValueChange = (newValues) => {
    // Just pass the selected values
    // ToggleGroup handles the adding/removing from the array
    onValueChange(newValues);
  };

  return (
    <ToggleGroup
      type="multiple"
      value={selectedValues}
      onValueChange={handleValueChange}
      spacing={0}
      dir={i18n.dir()}
      className={cn(
        "w-full flex h-8 bg-transparent rounded-[4px] p-0",
        props.className,
      )}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          className={cn(
            "h-full rounded-none text-[11px] font-bold border border-white/20 border-e-0 last:border-e first:rounded-s-[4px] last:rounded-e-[4px] transition-colors",
            "data-[state=on]:bg-accent-yellow data-[state=on]:text-black text-white/60 hover:bg-white/5",
            "px-0 whitespace-nowrap", // Ensure it fits and doesn't wrap
            triggerClassName,
          )}
        >
          {t(option)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export { FilterTabs };
