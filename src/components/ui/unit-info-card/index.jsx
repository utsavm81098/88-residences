import { ICONS } from "@/assets/icons";
import StatCell from "../../../features/building-tooltip/start-cell";

const STATUS_CONFIG = {
  available: { label: "Available", color: "#22c55e" },
  sold: { label: "Sold", color: "#ef4444" },
  reserved: { label: "Reserved", color: "#f59e0b" },
};

const ICON_PROPS = { size: 15, strokeWidth: 1.8 };

const Icons = {
  aptType: <ICONS.AptType {...ICON_PROPS} />,
  bedrooms: <ICONS.Bedrooms {...ICON_PROPS} />,
  area: <ICONS.Area {...ICON_PROPS} />,
  balcony: <ICONS.Balcony {...ICON_PROPS} />,
  type: <ICONS.Type {...ICON_PROPS} />,
  price: <ICONS.Price {...ICON_PROPS} />,
  direction: <ICONS.Compass {...ICON_PROPS} />,
};

export default function UnitInfoCard({ unit, onClose }) {
  if (!unit) return null;

  const statusInfo = STATUS_CONFIG[unit.status] ?? {
    label: unit.status,
    color: "#94a3b8",
  };

  return (
    <div className="hidden md:flex md:flex-col bg-card-bg border border-white/10 rounded-2xl w-full h-full overflow-hidden text-white pointer-events-auto">
      {/* ── Image Header ── */}
      <div className="relative h-40 w-full bg-slate-800">
        <img
          src="/models/apartment-placeholder.jpg"
          alt="Apartment"
          className="object-cover w-full h-full"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors"
          >
            <ICONS.X size={16} className="text-white" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* ── Header Row: Name + Status badge ── */}
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-2xl font-bold tracking-tight">
            Apt. {unit.name}
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

        {/* ── Price row ── */}
        {unit.price && (
          <div className="mb-4">
            <span className="text-[19px] font-bold  tracking-tight flex items-baseline gap-1">
              {unit.price}{" "}
              <span className="text-[12px] font-medium text-slate-400 saturate-0">
                (without VAT)
              </span>
            </span>
          </div>
        )}

        {/* ── Building / Floor row ── */}
        {(unit.building || unit.floor) && (
          <div className="text-[12px] font-medium text-slate-400 mb-4 flex items-center gap-2">
            {unit.building && <span>Building {unit.building}</span>}
            {unit.building && unit.floor && (
              <span className="text-white/15">|</span>
            )}
            {unit.floor && (
              <span>
                {unit.floor}
                <sup className="text-[9px] ml-0.5">th</sup> floor
              </span>
            )}
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 mb-6 bg-white/5 p-3 rounded-xl border border-white/5">
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
              label="rooms"
            />
          )}
          {unit.area && (
            <StatCell icon={Icons.area} value={unit.area} label="area, sq ft" />
          )}
        </div>

        <div className="mt-auto flex gap-3">
          <button className="flex-1 bg-accent-yellow hover:opacity-90 text-black font-bold py-2.5 rounded-xl transition-colors text-[14px]">
            View property
          </button>
          <button className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold py-2.5 rounded-xl transition-colors text-[14px]">
            Floor plan
          </button>
        </div>
      </div>
    </div>
  );
}

