import { useSelector, useDispatch } from "react-redux";
import { clearSelectedUnit } from "../../redux/reducers/buildingSlice";
import { useEffect, useRef } from "react";
import gsap from "gsap";
// Original simple stats for hover tooltip
import {
  IconLayoutGrid,
  IconBed,
  IconDimensions,
  IconBuildingBridge2,
  IconHome,
  IconCoinMonero,
  IconCompass,
} from "@tabler/icons-react";
import StatCell from "./start-cell";
import UnitInfoCard from "../../components/ui/unit-info-card";

const STATUS_CONFIG = {
  available: { label: "Available", color: "#22c55e" },
  sold: { label: "Sold", color: "#ef4444" },
  reserved: { label: "Reserved", color: "#f59e0b" },
};

const ICON_PROPS = { size: 15, stroke: 1.8 };
const Icons = {
  aptType: <IconLayoutGrid {...ICON_PROPS} />,
  bedrooms: <IconBed {...ICON_PROPS} />,
  area: <IconDimensions {...ICON_PROPS} />,
  balcony: <IconBuildingBridge2 {...ICON_PROPS} />,
  type: <IconHome {...ICON_PROPS} />,
  price: <IconCoinMonero {...ICON_PROPS} />,
  direction: <IconCompass {...ICON_PROPS} />,
};

const BuildingTooltip = () => {
  const dispatch = useDispatch();
  const tooltipState = useSelector((state) => state.tooltip);
  const selectedUnit = useSelector((state) => state.building.selectedUnit);

  const { visible, unit, x, y } = tooltipState;

  // Do not render hover tooltip for the currently selected unit
  const showHoverTooltip =
    visible && unit && (!selectedUnit || selectedUnit.name !== unit.name);

  // Reference for GSAP animation
  const desktopPopupRef = useRef(null);

  useEffect(() => {
    if (selectedUnit && desktopPopupRef.current) {
      gsap.fromTo(
        desktopPopupRef.current,
        { opacity: 0, y: -40, scale: 0.95, transformOrigin: "top right" },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" },
      );
    }
  }, [selectedUnit]);

  const statusInfo = unit
    ? (STATUS_CONFIG[unit.status] ?? { label: unit.status, color: "#94a3b8" })
    : null;

  const OFFSET_X = 16;
  const OFFSET_Y = 16;

  return (
    <>
      {/* ── Desktop Hover Tooltip (Hidden on mobile) ── */}
      <div
        className={`fixed top-0 left-0 pointer-events-none z-[9990] will-change-transform transition-opacity duration-150 ease-in-out hidden md:block`}
        style={{
          opacity: showHoverTooltip ? 1 : 0,
          transform: `translate(${x + OFFSET_X}px, ${y + OFFSET_Y}px)`,
        }}
      >
        {unit && (
          <div className="bg-[#0e0e14]/95 backdrop-blur-[16px] border border-white/10 rounded-xl px-4 py-3.5 min-w-[240px] max-w-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_0.5px_rgba(255,255,255,0.04)] text-white">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[17px] font-bold tracking-tight">
                {unit.name}
              </span>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wider uppercase"
                style={{
                  color: statusInfo.color,
                  background: `${statusInfo.color}22`,
                  border: `1px solid ${statusInfo.color}55`,
                }}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* ── Divider ── */}
            <div className="h-[1px] bg-white/10 mb-2.5" />

            {/* ── Building / Floor row ── */}
            {(unit.building || unit.floor) && (
              <div className="text-[11px] font-semibold text-slate-500 tracking-[0.1em] uppercase mb-3 flex items-center gap-2">
                {unit.building && <span>{unit.building}</span>}
                {unit.building && unit.floor && (
                  <span className="text-white/15">|</span>
                )}
                {unit.floor && (
                  <span>
                    {unit.floor}
                    <sup className="text-[8px] ml-0.5">th</sup> floor
                  </span>
                )}
              </div>
            )}

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {unit.aptType && (
                <StatCell
                  icon={Icons.aptType}
                  value={unit.aptType}
                  label="apt. type"
                />
              )}
              {unit.bedrooms && (
                <StatCell
                  icon={Icons.bedrooms}
                  value={unit.bedrooms}
                  label="bedrooms"
                />
              )}
              {unit.area && (
                <StatCell icon={Icons.area} value={unit.area} label="area" />
              )}
              {unit.balcony && (
                <StatCell
                  icon={Icons.balcony}
                  value={unit.balcony}
                  label="balcony, m²"
                />
              )}
              {unit.type && (
                <StatCell icon={Icons.type} value={unit.type} label="type" />
              )}
              {unit.direction && (
                <StatCell
                  icon={Icons.direction}
                  value={unit.direction}
                  label="direction"
                />
              )}
            </div>

            {/* ── Price row ── */}
            {unit.price && (
              <>
                <div className="h-[1px] bg-white/10 my-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">{Icons.price}</span>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                      price
                    </span>
                  </div>
                  <span className="text-[17px] font-bold text-violet-400 tracking-tight">
                    {unit.price}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Desktop Top-Right Popup (Hidden on mobile) ── */}
      <div
        ref={desktopPopupRef}
        className={`fixed right-6 top-24 z-[9999] w-[320px] hidden md:block ${selectedUnit ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}
      >
        {selectedUnit && (
          <UnitInfoCard
            unit={selectedUnit}
            onClose={() => dispatch(clearSelectedUnit())}
          />
        )}
      </div>

      {/* ── Mobile Bottom Sheet (Hidden on desktop) ── */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${selectedUnit ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`}
          onClick={() => dispatch(clearSelectedUnit())}
        />
        <div
          className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${selectedUnit ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="w-full h-auto bg-[#111116] rounded-t-3xl overflow-hidden pb-[env(safe-area-inset-bottom,16px)] border-t border-white/10">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-white/20"></div>
            </div>

            <div className="p-4">
              {selectedUnit && (
                <UnitInfoCard
                  unit={selectedUnit}
                  onClose={() => dispatch(clearSelectedUnit())}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BuildingTooltip;
