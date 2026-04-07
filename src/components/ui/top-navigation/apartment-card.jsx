import React, { memo } from "react";
import { IconHeart } from "@tabler/icons-react";
import { useSelector } from "react-redux";

const ApartmentCard = ({ unit }) => {
  const isSelected = useSelector((state) => {
    const selected = state.building.selectedUnit;
    if (!selected) return false;
    return Array.isArray(selected.name)
      ? selected.name.includes(unit.name)
      : selected.name === unit.name;
  });

  const dispName = Array.isArray(unit.name) ? unit.name.join(", ") : unit.name;

  return (
    <div
      className={`w-full snap-center bg-[#282932] border-2 ${
        isSelected ? "border-[#3b82f6]" : "border-transparent"
      } rounded-[22px] p-4 flex flex-col gap-2.5 relative transition-all active:scale-[0.98] shadow-lg shrink-0`}
    >
      {/* Badge */}

      <div className="flex justify-between items-center mt-1">
        <span className="font-extrabold text-white text-[20px] tracking-tight">
          {unit.bedrooms ? `${unit.bedrooms} br` : "Studio"}
        </span>
        <span className="text-white/60 font-bold text-sm flex items-center gap-2">
          # {dispName}
          <div className="p-1 bg-white/5 rounded-full">
            <IconHeart size={16} className="text-white/40" />
          </div>
        </span>
      </div>

      <div>
        <span className="text-[20px] font-bold text-white tracking-tight">
          {unit.price || "Contact Us"}
          {unit.price && " "}
        </span>
        {unit.price && (
          <span className="text-[11px] text-white/50 font-medium">
            (without VAT)
          </span>
        )}
      </div>

      <div className="flex gap-3 mt-1">
        <button className="flex-1 bg-transparent border border-white/10 hover:bg-white/5 text-white text-[13px] font-bold py-2.5 rounded-xl transition-colors">
          Floor plan
        </button>
        <button className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
          View property
        </button>
      </div>
    </div>
  );
};

export default memo(ApartmentCard);
