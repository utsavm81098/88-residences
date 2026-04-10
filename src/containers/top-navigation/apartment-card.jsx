import React, { memo } from "react";
import { ICONS } from "@/assets/icons";
import { Button } from "@/components/ui/button";

const ApartmentCard = ({ unit, isSelected }) => {
  const dispName = Array.isArray(unit.name) ? unit.name.join(", ") : unit.name;

  return (
    <div
      className={`w-full snap-center bg-card-mobile border-2 ${
        isSelected ? "border-blue-500" : "border-transparent"
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
            <ICONS.Heart size={16} className="text-white/40" />
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
        <Button 
          variant="outline" 
          className="flex-1 bg-transparent border border-white/10 text-white text-[13px] font-bold h-11 rounded-xl"
        >
          Floor plan
        </Button>
        <Button 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-[13px] font-bold h-11 rounded-xl shadow-lg shadow-blue-500/20 border-0"
        >
          View property
        </Button>
      </div>
    </div>
  );
};

export default memo(ApartmentCard);

