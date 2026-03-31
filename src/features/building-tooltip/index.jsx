import { useSelector } from "react-redux";
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
  const tooltipState = useSelector((state) => state.tooltip);
  const { visible, unit, x, y } = tooltipState;

  const statusInfo = unit
    ? (STATUS_CONFIG[unit.status] ?? { label: unit.status, color: "#94a3b8" })
    : null;

  // Clamping logic is simplified to fixed offsets as we're moving towards
  // a purely data-driven system per user request.
  const OFFSET_X = 16;
  const OFFSET_Y = 16;

  return (
    <div
      className={`fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform transition-opacity duration-150 ease-in-out`}
      style={{
        opacity: visible && unit ? 1 : 0,
        transform: `translate(${x + OFFSET_X}px, ${y + OFFSET_Y}px)`,
      }}
    >
      {unit && (
        <div className="bg-[#0e0e14]/95 backdrop-blur-[16px] border border-white/10 rounded-xl px-4 py-3.5 min-w-[240px] max-w-[280px] shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_0.5px_rgba(255,255,255,0.04)] text-white">
          {/* ── Header Row: Name + Status badge ── */}
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
  );
};

export default BuildingTooltip;
