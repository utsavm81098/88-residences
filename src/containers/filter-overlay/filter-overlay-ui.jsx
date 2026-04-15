import React, { memo, useEffect, useRef, useCallback } from "react";
import { ICONS } from "@/assets/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { createPortal } from "react-dom";

const FilterSection = memo(({ title, children, className }) => (
  <div className={cn("space-y-3", className)}>
    <h3 className="text-white font-medium text-[15px]">{title}</h3>
    <div className="flex flex-wrap gap-2.5">{children}</div>
  </div>
));

const FilterButton = memo(({ active, onClick, children, icon: Icon }) => (
  <Button
    variant="ghost"
    onClick={onClick}
    className={cn(
      "h-10 px-5 rounded-full border border-white/20 transition-all duration-200",
      "text-white text-sm font-medium hover:bg-white/5 active:scale-95",
      active && "border-accent-yellow bg-accent-yellow/5 text-accent-yellow"
    )}
  >
    {Icon && <Icon size={16} className="mr-2" />}
    {children}
  </Button>
));

const FilterOverlayUI = memo(({
  isOpen,
  onClose,
  selectedFilters,
  toggleFilter,
  handleClearAll,
  handleApplyFilters,
  filteredCount,
  activeFiltersCount,
  buildings,
}) => {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const tl = gsap.timeline();
      
      tl.to(overlayRef.current, { 
        display: "flex", 
        duration: 0 
      })
      .to(backdropRef.current, { 
        opacity: 1, 
        duration: 0.4, 
        ease: "power2.out" 
      })
      .fromTo(contentRef.current, 
        { y: "100%" }, 
        { y: "0%", duration: 0.5, ease: "power4.out" },
        "<"
      );
    } else if (overlayRef.current) {
      document.body.style.overflow = "";
      const tl = gsap.timeline({
        onComplete: () => {
          if (overlayRef.current) overlayRef.current.style.display = "none";
        }
      });

      tl.to(contentRef.current, { 
        y: "100%", 
        duration: 0.4, 
        ease: "power3.in" 
      })
      .to(backdropRef.current, { 
        opacity: 0, 
        duration: 0.3, 
        ease: "power2.in" 
      }, "-=0.2");
    }
  }, [isOpen]);

  // Clean up overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const overlayContent = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[4000] flex flex-col justify-end md:hidden overflow-hidden"
      style={{ display: "none" }}
    >
      {/* Backdrop */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-md opacity-0 pointer-events-none"
      />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative w-full bg-sidebar rounded-t-[32px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border-t border-white/10"
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-white/20 rounded-full cursor-pointer" />
        </div>

        {/* Header */}
        <div className="px-6 py-2 flex items-center justify-between">
          <h2 className="text-white text-xl font-bold tracking-tight">
            Filter options
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white rounded-full h-10 w-10 p-0"
            onClick={onClose}
          >
            <ICONS.X size={24} />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar mb-2 mt-2">
          <FilterSection title="Rooms">
            {["1", "2", "3", "4"].map((room) => (
              <Button
                key={room}
                variant="ghost"
                onClick={() => toggleFilter("rooms", room)}
                className={cn(
                  "w-12 h-12 rounded-full border border-white/20 text-white font-medium transition-all hover:bg-white/5",
                  selectedFilters.rooms.includes(room) &&
                    "border-accent-yellow text-accent-yellow bg-accent-yellow/5"
                )}
              >
                {room}
              </Button>
            ))}
          </FilterSection>

          <FilterSection title="Budget (without VAT) €">
            {["0 - 199K", "199K - 398K", "398K - 596K", "596K+"].map(
              (range) => (
                <FilterButton
                  key={range}
                  active={selectedFilters.budget === range}
                  onClick={() => toggleFilter("budget", range)}
                >
                  {range}
                </FilterButton>
              )
            )}
          </FilterSection>

          <FilterSection title="Type">
            {[
              { label: "Gdn. Apt.", icon: ICONS.Type },
              { label: "Apt.", icon: ICONS.Building },
              { label: "PH", icon: ICONS.Home },
            ].map((type) => (
              <FilterButton
                key={type.label}
                icon={type.icon}
                active={selectedFilters.type.includes(type.label)}
                onClick={() => toggleFilter("type", type.label)}
              >
                {type.label}
              </FilterButton>
            ))}
          </FilterSection>

          <FilterSection title="Exposure">
            {["Pool View", "Valley View"].map((exp) => (
              <FilterButton
                key={exp}
                active={selectedFilters.exposure.includes(exp)}
                onClick={() => toggleFilter("exposure", exp)}
              >
                {exp}
              </FilterButton>
            ))}
          </FilterSection>

          <FilterSection title="Buildings">
            {buildings.map((building) => (
              <FilterButton
                key={building}
                active={selectedFilters.buildings === building}
                onClick={() => toggleFilter("buildings", building)}
              >
                {building}
              </FilterButton>
            ))}
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="p-4 bg-sidebar border-t border-white/5 flex flex-row items-center gap-4 mt-0 items-start">
          <Button
            className="flex-1 h-12 rounded-full bg-white text-black font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-transform"
            onClick={handleApplyFilters}
          >
            Show apartments ({filteredCount})
          </Button>
          <Button
            variant="link"
            className="text-white font-semibold underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all text-sm px-2"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
});

export default FilterOverlayUI;
