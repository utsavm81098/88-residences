import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  IconChevronLeft,
  IconChevronRight,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { BUILDING_CONFIG } from "../../../utils/constant";
import {
  nextBuilding,
  prevBuilding,
  setBuilding,
  toggleMenu,
} from "../../../redux/reducers/buildingSlice";

const TopNavigation = ({ onReset }) => {
  const dispatch = useDispatch();
  const { currentBuilding, isMenuOpen } = useSelector(
    (state) => state.building,
  );

  // Close menu when clicking items
  const handleSelect = (index) => {
    dispatch(setBuilding(index));
  };

  return (
    <div className="absolute top-6 right-6 flex items-center gap-3 pointer-events-none z-[1000] select-none">
      {/* Floor Selector Capsule */}
      <div className="relative pointer-events-auto">
        <div className="flex items-center justify-between min-w-[200px] h-12 px-3 bg-[#2d2d2d]/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all duration-200 hover:border-white/20">
          <button
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
            onClick={() => dispatch(prevBuilding())}
          >
            <IconChevronLeft size={20} stroke={2} />
          </button>

          <div
            className="mx-4 text-white font-['Outfit'] font-semibold text-base tracking-wider cursor-pointer hover:text-white/80 transition-colors"
            onClick={() => dispatch(toggleMenu())}
          >
            {currentBuilding.name}
          </div>

          <button
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
            onClick={() => dispatch(nextBuilding())}
          >
            <IconChevronRight size={20} stroke={2} />
          </button>
        </div>

        {/* Dropdown Menu - matches attached image style */}
        {isMenuOpen && (
          <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[85%] bg-[#2d2d2d]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
              {BUILDING_CONFIG.map((b, idx) => (
                <div
                  key={b.name}
                  className={`px-4 py-3 text-center text-white font-['Outfit'] text-sm cursor-pointer transition-colors hover:bg-white/10 ${
                    currentBuilding.name === b.name
                      ? "bg-white/5 font-bold"
                      : "font-medium"
                  }`}
                  onClick={() => handleSelect(idx)}
                >
                  {b.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Round Reset Button */}
      <button
        className="flex items-center justify-center w-12 h-12 bg-[#2d2d2d]/85 backdrop-blur-md border border-white/10 rounded-full text-white shadow-2xl pointer-events-auto transition-all duration-200 hover:bg-white/10 hover:text-white hover:-translate-y-0.5 active:scale-95 translate-y-0"
        onClick={onReset}
      >
        <IconRotateClockwise size={20} stroke={2} />
      </button>
    </div>
  );
};

export default TopNavigation;
