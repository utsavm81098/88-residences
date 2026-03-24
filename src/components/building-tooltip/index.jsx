import { useEffect, useRef } from "react";

const STATUS_CONFIG = {
  available: { label: "Available", color: "#22c55e" },
  sold: { label: "Sold", color: "#ef4444" },
  reserved: { label: "Reserved", color: "#f59e0b" },
};

const Icons = {
  aptType: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  bedrooms: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 12v6h18v-6" />
      <path d="M3 12V8a1 1 0 011-1h4a1 1 0 011 1v4" />
      <path d="M15 12V8a1 1 0 011-1h4a1 1 0 011 1v4" />
      <path d="M3 18v2M21 18v2" />
    </svg>
  ),
  area: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 3h6v6H3zM3 15h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6z" />
    </svg>
  ),
  balcony: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="2" y="6" width="20" height="4" rx="1" />
      <path d="M6 10v8M18 10v8M2 18h20" />
    </svg>
  ),
  // ── NEW: type icon (home/unit layout)
  type: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  // ── NEW: price icon (tag/currency)
  price: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5A2.5 2.5 0 0112 7h.5a2 2 0 010 4h-1a2 2 0 000 4h.5a2.5 2.5 0 002.5-2.5" />
    </svg>
  ),
  direction: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

const BuildingTooltip = ({ tooltipState, tooltipElRef }) => {
  const { visible, unit } = tooltipState;

  const statusInfo = unit
    ? (STATUS_CONFIG[unit.status] ?? { label: unit.status, color: "#94a3b8" })
    : null;

  return (
    <div
      ref={tooltipElRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        transform: "translate(-9999px, -9999px)",
        opacity: visible && unit ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
    >
      {unit && (
        <div
          style={{
            background: "rgba(14, 14, 20, 0.96)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "14px 16px",
            minWidth: "230px",
            maxWidth: "270px",
            boxShadow:
              "0 16px 48px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04)",
            color: "#fff",
            fontFamily: "inherit",
          }}
        >
          {/* ── Row 1: Name + Status badge ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "17px",
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {unit.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: statusInfo.color,
                background: `${statusInfo.color}22`,
                padding: "3px 10px",
                borderRadius: "20px",
                border: `1px solid ${statusInfo.color}55`,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* ── Divider ── */}
          <div
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.08)",
              marginBottom: "10px",
            }}
          />

          {/* ── Row 2: Building | Floor ── */}
          {(unit.building || unit.floor) && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748b",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {unit.building && <span>{unit.building}</span>}
              {unit.building && unit.floor && (
                <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
              )}
              {unit.floor && (
                <span>
                  {unit.floor}
                  <sup style={{ fontSize: "8px", marginLeft: "1px" }}>
                    th
                  </sup>{" "}
                  floor
                </span>
              )}
            </div>
          )}

          {/* ── Stats Grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 12px",
            }}
          >
            {/* Existing fields */}
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

            {/* ── NEW fields from your JSON ── */}
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

          {/* ── NEW: Price — full-width row at bottom ── */}
          {unit.price && (
            <>
              <div
                style={{
                  height: "1px",
                  background: "rgba(255,255,255,0.08)",
                  margin: "12px 0 10px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ color: "#475569" }}>{Icons.price}</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    price
                  </span>
                </div>
                {/* Price gets its own highlight color */}
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#a78bfa", // purple accent — change to your brand color
                    letterSpacing: "0.02em",
                  }}
                >
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

const StatCell = ({ icon, value, label }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
    <span style={{ color: "#475569", marginTop: "2px", flexShrink: 0 }}>
      {icon}
    </span>
    <div>
      <div style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
        {label}
      </div>
    </div>
  </div>
);

export default BuildingTooltip;
