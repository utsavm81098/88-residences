import { useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { setBuildingImmediate } from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { logger } from "@/utils/logger";
import { getDashboardRoute } from "@/utils/helper";
import { preloadBuilding } from "@/utils/preloader";
import i18n from "@/i18n";

/**
 * Measured roof centres for the seven residential buildings in
 * 88RES-06-final-trees.glb.  These values come from the roof meshes in the
 * model (not the scene envelope), so each marker remains centred on its own
 * building rather than drifting along the masterplan diagonal.
 *
 * Every marker shares the same Y coordinate to keep the labels on one level
 * plane. The X/Z pair still lands the pin above the correct building.
 */
export const BUILDING_MARKER_Y = 22.5;

export const BUILDING_ROOF_ANCHORS = {
  A: [4.63, BUILDING_MARKER_Y, 69.67],
  B: [-2.42, BUILDING_MARKER_Y, 48.62],
  C: [-7.16, BUILDING_MARKER_Y, 25.39],
  D: [-8.89, BUILDING_MARKER_Y, -13.72],
  E: [-9.32, BUILDING_MARKER_Y - 0.5, -35.61],
  F: [-8.28, BUILDING_MARKER_Y - 0.5, -57.57],
  G: [-7.52, BUILDING_MARKER_Y - 0.5, -79.42],
};

/**
 * useBuildingMarkers — Returns building marker positions, manages hover/selection
 * state, and handles navigation/building focus when markers are clicked.
 */
export const useBuildingMarkers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Scoped to `inventory` specifically (not the whole `building` slice):
  // that slice changes reference on ~9 unrelated actions (selectedUnit,
  // filters, transitions, ...), which would otherwise re-render every
  // marker on every one of those, even though `markers` below only ever
  // depends on `inventory`.
  const inventory = useSelector((state) => state.building.inventory);

  const markers = useMemo(() => {
    return BUILDING_CONFIG.map((config, index) => {
      const name = config.name;

      const position = BUILDING_ROOF_ANCHORS[name] || [0, 0, 0];

      const bUnits = inventory?.[name] || [];
      const availableCount = bUnits.filter(
        (u) => u.status === "available",
      ).length;
      const reservedCount = bUnits.filter(
        (u) => u.status === "reserved",
      ).length;
      const soldCount = bUnits.filter((u) => u.status === "sold").length;

      let status = "available";
      if (bUnits.length > 0) {
        if (availableCount > 0) status = "available";
        else if (reservedCount > 0) status = "reserved";
        else if (soldCount > 0) status = "sold";
      }

      return {
        name,
        index,
        position,
        status,
        availableCount,
        totalUnits: bUnits.length,
      };
    });
  }, [inventory]);

  const handleHoverBuilding = useCallback((buildingIndex, buildingName) => {
    preloadBuilding(buildingIndex ?? buildingName);
  }, []);

  const handleSelectBuilding = useCallback(
    (buildingIndex, buildingName) => {
      logger.info(
        `[useBuildingMarkers] Marker clicked: Building ${buildingName} (index ${buildingIndex})`,
      );
      preloadBuilding(buildingIndex ?? buildingName);
      dispatch(setBuildingImmediate(buildingIndex));
      // Use the language-aware route so the /dashboard-en prefix is preserved.
      // buildingName is already uppercase ("A"…"G").
      const inventoryPath = getDashboardRoute(i18n, `inventory?building=${buildingName}`);
      navigate(inventoryPath);
    },
    [dispatch, navigate],
  );

  return {
    markers,
    handlers: {
      handleSelectBuilding,
      handleHoverBuilding,
    },
  };
};

export default useBuildingMarkers;
