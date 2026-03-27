import {
  IconLayoutGrid,
  IconBed,
  IconDimensions,
  IconBuildingBridge2,
  IconHome,
  IconCoinMonero,
  IconCompass,
} from "@tabler/icons-react";
import "./building-tooltip.css";
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

const BuildingTooltip = ({ tooltipState, tooltipElRef }) => {
  const { visible, unit } = tooltipState;

  const statusInfo = unit
    ? (STATUS_CONFIG[unit.status] ?? { label: unit.status, color: "#94a3b8" })
    : null;

  return (
    <div
      ref={tooltipElRef}
      className="tooltip-wrapper"
      style={{
        opacity: visible && unit ? 1 : 0,
      }}
    >
      {unit && (
        <div className="tooltip-card">
          {/* ── Row 1: Name + Status badge ── */}
          <div className="tooltip-header">
            <span className="tooltip-name">{unit.name}</span>
            <span
              className="tooltip-status-badge"
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
          <div className="tooltip-divider" />

          {/* ── Row 2: Building | Floor ── */}
          {(unit.building || unit.floor) && (
            <div className="tooltip-meta">
              {unit.building && <span>{unit.building}</span>}
              {unit.building && unit.floor && (
                <span className="tooltip-meta__separator">|</span>
              )}
              {unit.floor && (
                <span>
                  {unit.floor}
                  <sup className="tooltip-meta__floor-sup">th</sup> floor
                </span>
              )}
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div className="tooltip-stats-grid">
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

          {/* ── Price — full-width row at bottom ── */}
          {unit.price && (
            <>
              <div className="tooltip-divider--price" />
              <div className="tooltip-price-row">
                <div className="tooltip-price-label">
                  <span className="tooltip-price-label__icon">
                    {Icons.price}
                  </span>
                  <span className="tooltip-price-label__text">price</span>
                </div>
                <span className="tooltip-price-value">{unit.price}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildingTooltip;
