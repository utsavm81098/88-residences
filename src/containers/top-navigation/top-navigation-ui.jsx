import { ICONS } from "@/assets/icons";
import MobileMenu from "./mobile-menu";
import { Button } from "@/components/ui/button";

const TopNavigation = ({
  currentBuilding,
  isMenuOpen,
  totalApt,
  buildingUnits,
  handleNext,
  handlePrev,
  handleSelect,
  onToggleMenu,
  onReset,
  buildings,
}) => {
  return (
    <>
      <div className="hidden md:flex absolute top-6 right-6 items-center gap-3 pointer-events-none z-[1000] select-none">
        <div className="relative pointer-events-auto">
          <div className="flex items-center justify-between min-w-[200px] h-12 px-3 bg-nav/85 backdrop-blur-md border border-white/10 rounded-full shadow-2xl transition-all duration-200 hover:border-white/20">
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-white/70 hover:text-white rounded-full border-0"
              onClick={handlePrev}
            >
              <ICONS.ChevronLeft size={20} strokeWidth={2} />
            </Button>

            <div
              className="mx-4 text-white font-outfit font-semibold text-base tracking-wider cursor-pointer hover:text-white/80 transition-colors"
              onClick={onToggleMenu}
            >
              {currentBuilding.name}
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              className="text-white/70 hover:text-white rounded-full border-0"
              onClick={handleNext}
            >
              <ICONS.ChevronRight size={20} strokeWidth={2} />
            </Button>
          </div>

          {/* Dropdown Menu */}
          {/* ... existing dropdown ... */}
          {isMenuOpen && (
            <div className="absolute top-[52px] left-1/2 -translate-x-1/2 w-[85%] bg-nav/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {buildings.map((b, idx) => (
                  <div
                    key={b.name}
                    className={`px-4 py-3 text-center text-white font-outfit text-sm cursor-pointer transition-colors hover:bg-white/10 ${
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
        <Button
          variant="ghost"
          size="icon-lg"
          className="bg-nav/85 backdrop-blur-md border border-white/10 rounded-full text-white shadow-2xl pointer-events-auto hover:-translate-y-0.5"
          onClick={onReset}
        >
          <ICONS.RotateCw size={20} strokeWidth={2} />
        </Button>
      </div>

      {/* Mobile Top Bar */}
      <MobileMenu
        {...{
          handleNext,
          handlePrev,
          currentBuilding,
          totalApt,
          buildingUnits,
        }}
      />
    </>
  );
};

export default TopNavigation;

