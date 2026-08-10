import { memo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useBuildingMarkers from "./use-building-markers";

// Extra pixels a blocked marker must clear before it is allowed to reappear.
const HYSTERESIS_PX = 8;

const MARKER_TIERS = {
  mobile: {
    iconClass: "h-12 w-12 min-h-[48px] min-w-[48px]",
    collisionDistance: 10,
  },
  tablet: {
    iconClass: "h-14 w-14 min-h-[56px] min-w-[56px]",
    collisionDistance: 12,
  },
  desktop: {
    iconClass: "h-20 w-20 min-h-[80px] min-w-[80px]",
    collisionDistance: 15,
  },
};

const getMarkerTier = (width) => {
  if (width < 768) return MARKER_TIERS.mobile;
  if (width < 1024) return MARKER_TIERS.tablet;
  return MARKER_TIERS.desktop;
};

const markerWorldPosition = new THREE.Vector3();
const _candidatesPool = Array.from({ length: 16 }, () => ({
  name: "",
  x: 0,
  y: 0,
  distance: 0,
}));

/**
 * Hides the farther marker when two marker icons overlap in screen space.
 * Also calculates 3D camera distance zIndex so nearer markers ALWAYS render
 * in front of farther markers.
 */
const useMarkerOverlapVisibility = (markers, collisionDistance) => {
  const [blockedMarkerNames, setBlockedMarkerNames] = useState(() => new Set());
  const [zIndexMap, setZIndexMap] = useState(() => ({}));
  const blockedSetRef = useRef(new Set());
  const lastBlockedListRef = useRef([]);

  useFrame(({ camera, size }) => {
    let candidateCount = 0;
    let zIndexChanged = false;
    const newZIndexMap = {};

    for (let i = 0; i < markers.length; i++) {
      const { name, position } = markers[i];
      const [x, y, z] = position;
      const dx = x - camera.position.x;
      const dy = y - camera.position.y;
      const dz = z - camera.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Nearer markers get a higher zIndex so they render on top of farther ones.
      const zIndex = Math.max(1, 10000 - Math.round(dist * 10));
      if (zIndexMap[name] !== zIndex) {
        zIndexChanged = true;
      }
      newZIndexMap[name] = zIndex;

      markerWorldPosition.set(x, y, z).project(camera);

      // Do not let off-screen or behind-camera markers participate in a
      // collision decision. Html already controls their normal visibility.
      if (markerWorldPosition.z < -1 || markerWorldPosition.z > 1) {
        continue;
      }

      if (candidateCount < _candidatesPool.length) {
        const item = _candidatesPool[candidateCount++];
        item.name = name;
        item.x = (markerWorldPosition.x * size.width) / 2 + size.width / 2;
        item.y = (-markerWorldPosition.y * size.height) / 2 + size.height / 2;
        item.distance = dist;
      }
    }

    if (zIndexChanged) {
      setZIndexMap(newZIndexMap);
    }

    const activeCandidates = _candidatesPool.slice(0, candidateCount);
    activeCandidates.sort((a, b) => a.distance - b.distance);

    const visibleCandidates = [];
    const blockedNames = [];

    for (let i = 0; i < activeCandidates.length; i++) {
      const candidate = activeCandidates[i];
      const isCurrentlyBlocked = blockedSetRef.current.has(candidate.name);
      const threshold = isCurrentlyBlocked
        ? collisionDistance + HYSTERESIS_PX
        : collisionDistance;

      // Anisotropic metric: vertical distance is weighted (0.75) because pin icons extend upward.
      let isBlocked = false;
      for (let j = 0; j < visibleCandidates.length; j++) {
        const visible = visibleCandidates[j];
        const dx = candidate.x - visible.x;
        const dy = (candidate.y - visible.y) * 0.75;
        if (Math.hypot(dx, dy) < threshold) {
          isBlocked = true;
          break;
        }
      }

      if (isBlocked) blockedNames.push(candidate.name);
      else visibleCandidates.push(candidate);
    }

    const prevBlocked = lastBlockedListRef.current;
    let blockedChanged = prevBlocked.length !== blockedNames.length;
    if (!blockedChanged) {
      for (let i = 0; i < blockedNames.length; i++) {
        if (prevBlocked[i] !== blockedNames[i]) {
          blockedChanged = true;
          break;
        }
      }
    }

    if (blockedChanged) {
      lastBlockedListRef.current = blockedNames;
      const nextSet = new Set(blockedNames);
      blockedSetRef.current = nextSet;
      setBlockedMarkerNames(nextSet);
    }
  });

  return { blockedMarkerNames, zIndexMap };
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
  zIndex,
  iconClass,
  onSelect,
}) {
  const { name, index, position, status } = marker;

  return (
    <Html
      position={position}
      occlude={false}
      style={{
        opacity: isBlocked ? 0 : 1,
        transition: "opacity 0.15s ease",
        pointerEvents: isBlocked ? "none" : "auto",
        userSelect: "none",
        zIndex: isBlocked ? -1 : zIndex,
      }}
      className="[@media(hover:hover)]:hover:!z-[9999]"
    >
      <div
        onClick={() => onSelect(index, name)}
        className="group relative flex cursor-pointer flex-col items-center"
        style={{ transform: "translate(-50%, -90%)" }}
      >
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
  const { blockedMarkerNames, zIndexMap } = useMarkerOverlapVisibility(
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
          zIndex={zIndexMap[marker.name] || 1000}
          iconClass={tier.iconClass}
          onSelect={handlers.handleSelectBuilding}
        />
      ))}
    </group>
  );
};

export default memo(BuildingMarkers);
