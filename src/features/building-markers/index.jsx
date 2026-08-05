import { memo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useBuildingMarkers from "./use-building-markers";

// Extra pixels a blocked marker must clear before it is allowed to reappear.
// This dead-band prevents markers sitting exactly at the collision edge from
// oscillating blocked↔visible on consecutive frames (the blink/flicker bug).
const HYSTERESIS_PX = 12;

// Matches the tri-tier breakpoints already used by the inventory scene's
// useResponsiveConfig (768/1024), so "mobile"/"tablet"/"desktop" mean the same
// thing everywhere in the app. Below `lg` (1024) the sidebar rail also gives
// way to the bottom nav, so the canvas itself is narrower here too — a 96px
// icon that reads fine on desktop is oversized and crowds 7 markers together
// on a 375px phone. Sizes stay well above the 44px touch-target minimum.
const MARKER_TIERS = {
  mobile: {
    iconClass: "h-12 w-12 min-h-[48px] min-w-[48px]",
    collisionDistance: 12,
  },
  tablet: {
    iconClass: "h-16 w-16 min-h-[64px] min-w-[64px]",
    collisionDistance: 16,
  },
  desktop: {
    iconClass: "h-24 w-24 min-h-[96px] min-w-[96px]",
    collisionDistance: 72,
  },
};

const getMarkerTier = (width) => {
  if (width < 768) return MARKER_TIERS.mobile;
  if (width < 1024) return MARKER_TIERS.tablet;
  return MARKER_TIERS.desktop;
};

const markerWorldPosition = new THREE.Vector3();

/**
 * Hides the farther marker when two marker icons overlap in screen space.
 * This resolves the DOM-to-DOM case, where a farther HTML marker would
 * otherwise draw on top of the nearer one.
 */
const useMarkerOverlapVisibility = (markers, collisionDistance) => {
  const [blockedMarkerNames, setBlockedMarkerNames] = useState(() => new Set());
  const blockedMarkerKeyRef = useRef("");
  // Mirrors the current blocked set so useFrame can read it without causing
  // re-renders — the ref is always in sync with the state value.
  const blockedSetRef = useRef(new Set());

  useFrame(({ camera, size }) => {
    const candidates = [];

    for (const { name, position } of markers) {
      const [x, y, z] = position;
      const dx = x - camera.position.x;
      const dy = y - camera.position.y;
      const dz = z - camera.position.z;

      markerWorldPosition.set(x, y, z).project(camera);

      // Do not let off-screen or behind-camera markers participate in a
      // collision decision. Html already controls their normal visibility.
      if (markerWorldPosition.z < -1 || markerWorldPosition.z > 1) {
        continue;
      }

      candidates.push({
        name,
        x: (markerWorldPosition.x * size.width) / 2 + size.width / 2,
        y: (-markerWorldPosition.y * size.height) / 2 + size.height / 2,
        // The nearest marker owns an overlapping screen position.
        distance: dx * dx + dy * dy + dz * dz,
      });
    }

    candidates.sort((a, b) => a.distance - b.distance);

    const visibleCandidates = [];
    const blockedNames = [];

    for (const candidate of candidates) {
      // Hysteresis: a currently-blocked marker uses a larger exit threshold so
      // it cannot toggle back to visible while sitting exactly at the boundary.
      // This is the core fix for the blink: a marker that is already hidden
      // must move HYSTERESIS_PX further away before it reappears.
      const isCurrentlyBlocked = blockedSetRef.current.has(candidate.name);
      const threshold = isCurrentlyBlocked
        ? collisionDistance + HYSTERESIS_PX // harder to exit blocked state
        : collisionDistance;                // normal entry threshold

      const isBlocked = visibleCandidates.some(
        (visible) =>
          Math.hypot(candidate.x - visible.x, candidate.y - visible.y) <
          threshold,
      );

      if (isBlocked) blockedNames.push(candidate.name);
      else visibleCandidates.push(candidate);
    }

    const nextKey = blockedNames.join("|");
    if (nextKey === blockedMarkerKeyRef.current) return;

    blockedMarkerKeyRef.current = nextKey;
    const nextSet = new Set(blockedNames);
    blockedSetRef.current = nextSet;
    setBlockedMarkerNames(nextSet);
  });

  return blockedMarkerNames;
};

const STATUS_COLORS = {
  available: {
    stop0: "#EAD08A",
    stop1: "#C9A24B",
    fill: "#C9A24B",
  },
  reserved: {
    stop0: "#F6C651",
    stop1: "#E0A020",
    fill: "#E0A020",
  },
  sold: {
    stop0: "#B06066",
    stop1: "#8E4046",
    fill: "#8E4046",
  },
};

const MarkerIcon = memo(function MarkerIcon({ status, letter, className }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.available;
  const gradientId = `g_${status}_${letter}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="100 110 100 130"
      className={className}
      style={{ filter: "drop-shadow(0px 3px 3.5px rgba(26, 18, 0, 0.45))" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.stop0} />
          <stop offset="1" stopColor={colors.stop1} />
        </linearGradient>
      </defs>
      <g>
        <polygon points="137.0,208 163.0,208 150.0,227" fill={colors.fill} />
        <circle
          cx="150.0"
          cy="165"
          r="40"
          fill={`url(#${gradientId})`}
          stroke="#FFFFFF"
          strokeWidth="3.5"
        />
        <text
          x="150.0"
          y="163"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="32"
          fontWeight="800"
          fill="#FFFFFF"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {letter}
        </text>
      </g>
    </svg>
  );
});

const MarkerItem = memo(function MarkerItem({
  marker,
  isBlocked,
  iconClass,
  onSelect,
}) {
  const { name, index, position, status } = marker;

  // Keep the Html node permanently mounted — toggling between return null and
  // a full node causes a hard DOM unmount/remount on every visibility change,
  // which is exactly what produces the pop/blink on slow camera pans.
  // Instead we drive visibility via CSS opacity + pointer-events so the
  // transition is always smooth and no Three.js portal teardown occurs.
  return (
    <Html
      position={position}
      occlude={false}
      style={{
        // Fade out smoothly rather than snapping to invisible.
        opacity: isBlocked ? 0 : 1,
        transition: "opacity 0.15s ease",
        // Disable interaction while invisible so clicks/taps can't land on a
        // hidden marker that is still technically in the DOM.
        pointerEvents: isBlocked ? "none" : "auto",
        userSelect: "none",
        zIndex: isBlocked ? -1 : 1000,
      }}
      className="z-50 [@media(hover:hover)]:hover:!z-[9999]"
    >
      <div
        onClick={() => onSelect(index, name)}
        className="group relative flex cursor-pointer flex-col items-center"
        // The SVG's pin point is 90% down its viewBox.  Html's default origin
        // is the supplied 3D coordinate, so moving this element up by 90%
        // locks the pin point—not its box centre—to the measured roof centre.
        style={{ transform: "translate(-50%, -90%)" }}
      >
        {/* SVG Ring Icon — Clean scaling, no drop shadow */}
        <div
          className="relative flex origin-bottom items-center justify-center transition-transform duration-300 scale-100 [@media(hover:hover)]:group-hover:scale-125 group-active:scale-90 group-active:duration-75 z-10"
          style={{ transformOrigin: "50% 90%" }}
        >
          <MarkerIcon
            status={status}
            letter={name}
            className={`${iconClass} pointer-events-none transition-transform duration-300`}
          />
        </div>
      </div>
    </Html>
  );
});

export const BuildingMarkers = () => {
  const { markers, handlers } = useBuildingMarkers();
  const viewportWidth = useThree((state) => state.size.width);
  const tier = getMarkerTier(viewportWidth);
  const blockedMarkerNames = useMarkerOverlapVisibility(
    markers,
    tier.collisionDistance,
  );

  return (
    <group name="BuildingMarkersGroup">
      {markers.map((marker) => (
        <MarkerItem
          key={marker.name}
          marker={marker}
          isBlocked={blockedMarkerNames.has(marker.name)}
          iconClass={tier.iconClass}
          onSelect={handlers.handleSelectBuilding}
        />
      ))}
    </group>
  );
};

export default memo(BuildingMarkers);
