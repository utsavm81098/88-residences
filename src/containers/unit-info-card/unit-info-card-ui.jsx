import { ICONS } from "@/assets/icons";
import StatCell from "@/features/building-tooltip/stat-cell";
import { Button } from "@/components/ui/button";

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
    <div className="hidden md:flex md:flex-col bg-card-bg/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full overflow-hidden text-white pointer-events-auto shadow-2xl">
      {/* ── Image Header ── (Reduced height from h-40 to h-32) */}
      <div className="relative h-32 w-full bg-slate-800">
        <img
          src="/models/apartment-placeholder.jpg"
          alt="Apartment"
          className="object-cover w-full h-full opacity-80"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {onClose && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md text-white border-0"
          >
            <ICONS.X size={14} />
          </Button>
        )}
      </div>

      <div className="p-3.5 flex flex-col">
        {/* ... existing header ... */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl font-bold tracking-tight">
            Apt. {unit.name}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
            style={{
              color: statusInfo.color,
              background: `${statusInfo.color}15`,
              border: `1px solid ${statusInfo.color}33`,
            }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* ... existing price ... */}
        {unit.price && (
          <div className="mb-3">
            <span className="text-[17px] font-bold tracking-tight flex items-baseline gap-1">
              {unit.price}{" "}
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest opacity-60">
                excl. vat
              </span>
            </span>
          </div>
        )}

        {/* ... existing floor row ... */}
        {(unit.building || unit.floor) && (
          <div className="text-[11px] font-medium text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
            {unit.building && <span>Bldg {unit.building}</span>}
            {unit.building && unit.floor && (
              <span className="text-white/10">•</span>
            )}
            {unit.floor && <span>Floor {unit.floor}</span>}
          </div>
        )}

        {/* ... existing stats grid ... */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 mb-5 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
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
          {unit.type && (
            <StatCell icon={Icons.type} value={unit.type} label="type" />
          )}
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 text-black bg-accent-yellow hover:bg-accent-yellow/80 font-bold h-10 rounded-lg text-[13px] border-0 transition-colors">
            View property
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-lg text-[13px] border-white/10 text-white/90 hover:bg-white/5"
          >
            Floor plan
          </Button>
        </div>
      </div>
    </div>
  );
}
