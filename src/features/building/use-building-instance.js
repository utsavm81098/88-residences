import { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useDispatch, useSelector } from "react-redux";
import { UNIT_COLORS, OUTLINE_KEY, BUILDING_CONFIG } from "@/utils/constant";
import { configureLoader } from "@/utils/preloader";
import {
  showTooltip,
  hideTooltip,
  updateTooltipPosition,
} from "@/store/slices/tooltip-slice";
import {
  setSelectedUnit,
  setMobileSelectedUnit,
} from "@/store/slices/building-slice";
import { useIsMobile } from "@/hooks/use-mobile";
// Preloading is now handled globally in src/main.jsx via src/utils/preloader.js

const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

// ── Constants (Coding Standards Compliance) ──────────────────────────────────
const EDGES_THRESHOLD_ANGLE = 15;
const OUTLINE_BASE_OPACITY = 0.3;
// const OUTLINE_BASE_OPACITY = 0.6;
const OUTLINE_HOVER_OPACITY = 1.0;
const ANIMATION_DURATION = 0.25;
const CAMERA_FOCUS_DURATION = 1.2;
const MOUSE_DRAG_THRESHOLD = 2;

const DEFAULT_OPACITIES = {
  available: {
    base: 0.1,
    hover: 0.45,
    selected: 0.65,
  },
  sold: {
    base: 0.2,
    hover: 0.45,
    selected: 0.65,
  },
};

// Helper to parse hex strings with optional alpha channel (e.g. #RRGGBBAA) into Three.js Color and opacity
const parseColorAndOpacity = (colorStr, defaultOpacity = 1.0) => {
  if (colorStr instanceof THREE.Color) {
    return { color: colorStr, opacity: defaultOpacity };
  }
  if (typeof colorStr === "string" && colorStr.startsWith("#")) {
    if (colorStr.length === 9) {
      const rgbPart = colorStr.substring(0, 7);
      const alphaPart = colorStr.substring(7, 9);
      const color = new THREE.Color(rgbPart);
      const opacity = parseInt(alphaPart, 16) / 255;
      return { color, opacity };
    } else {
      return { color: new THREE.Color(colorStr), opacity: defaultOpacity };
    }
  }
  return { color: new THREE.Color(colorStr), opacity: defaultOpacity };
};

const availableBase = parseColorAndOpacity(
  UNIT_COLORS.available.base,
  DEFAULT_OPACITIES.available.base,
);
const soldBase = parseColorAndOpacity(
  UNIT_COLORS.sold.base,
  DEFAULT_OPACITIES.sold.base,
);

// ── Shared Materials (Performance Optimization) ──────────────────────────────
const BASE_MATERIALS = {
  available: new THREE.MeshBasicMaterial({
    color: availableBase.color,
    transparent: true,
    opacity: availableBase.opacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }),
  sold: new THREE.MeshBasicMaterial({
    color: soldBase.color,
    transparent: true,
    opacity: soldBase.opacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  }),
};

// ── Shared Edge Material Template ────────────────────────────────────────────
const EDGE_MATERIAL_TEMPLATE = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: OUTLINE_BASE_OPACITY,
  depthTest: true,
  depthWrite: false,
  toneMapped: false,
});

// ── Performance Cache ────────────────────────────────────────────────────────
const EDGES_CACHE = new Map();

/**
 * Gets or creates a cached EdgesGeometry for a given geometry.
 * Significantly reduces memory usage and CPU time.
 */
const getCachedEdges = (geometry) => {
  if (EDGES_CACHE.has(geometry.uuid)) {
    return EDGES_CACHE.get(geometry.uuid);
  }
  const edges = new THREE.EdgesGeometry(geometry, EDGES_THRESHOLD_ANGLE);
  EDGES_CACHE.set(geometry.uuid, edges);
  return edges;
};

/**
 * Safely disposes all materials in a given glassScene.
 * Kills active GSAP tweens on materials to prevent memory leak references.
 */
const disposeSceneMaterials = (scene) => {
  if (!scene) return;
  scene.traverse((child) => {
    if (child.isMesh) {
      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach((m) => {
          gsap.killTweensOf([m.color, m]);
          m.dispose();
        });
      }

      // Clean up outline LineSegments materials
      child.children.forEach((subChild) => {
        if (subChild.material) {
          const subMaterials = Array.isArray(subChild.material)
            ? subChild.material
            : [subChild.material];
          subMaterials.forEach((m) => {
            gsap.killTweensOf(m);
            m.dispose();
          });
        }
      });
    }
  });
};

/**
 * Handles the logic for a single building instance.
 * Loads models, sets up hitboxes, and manages unit interactions.
 */
export const useBuildingInstance = ({ config, controlsRef }) => {
  const dispatch = useDispatch();
  const isDragging = useSelector((state) => state.drag.isDragging);
  const {
    selectedUnit,
    mobileSelectedUnit,
    inventory,
    isTransitioning,
    currentBuildingIndex,
  } = useSelector((state) => state.building);

  const currentBuilding = BUILDING_CONFIG[currentBuildingIndex];

  // Determine if this instance is the active building
  const isActiveBuilding = currentBuilding?.name === config.name;

  const isMobile = useIsMobile();
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const rotationTween = useRef(null);

  const activeSelection = useMemo(() => {
    return isMobile ? mobileSelectedUnit : selectedUnit;
  }, [selectedUnit, mobileSelectedUnit, isMobile]);

  const building = useGLTF(config.model, true, true, configureLoader);
  const glassHitbox = useGLTF(config.hitbox, true, true, configureLoader);

  const unitMap = useMemo(() => {
    const buildingData = inventory?.[config.name];
    const buildingUnits = Array.isArray(buildingData) ? buildingData : [];
    return buildingUnits.reduce((acc, unit) => {
      acc[unit.title] = unit;
      return acc;
    }, {});
  }, [inventory, config.name]);

  const buildingScene = useMemo(() => {
    const buildingClone = building.scene.clone();
    buildingClone.traverse((child) => {
      if (child.isMesh) {
        child.raycast = () => {};
        child.frustumCulled = false;
        child.receiveShadow = true;

        // Enhance PBR materials for richer environment reflections
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        const enhanced = materials.map((mat) => {
          if (!mat.isMeshStandardMaterial && !mat.isMeshPhysicalMaterial) {
            return mat;
          }

          // Clone material to avoid mutating shared GLB cache
          const cloned = mat.clone();

          const nameLC = (mat.name || "").toLowerCase();

          // Glass materials must remain glossy and reflective
          const isGlass =
            nameLC.includes("glass") ||
            nameLC.includes("grass") || // WIN_GRASS
            (cloned.transmission !== undefined && cloned.transmission > 0);

          // Metallic materials must remain reflective
          const isMetal =
            nameLC.includes("metal") ||
            nameLC.includes("aluminium") ||
            cloned.metalness > 0.5;

          // Robust classification: any material that is not glass, and not metal, is structural.
          // In addition, any metal part explicitly named "big" (window frame) or "railing" is matte (structural).
          const isStructural =
            !isGlass &&
            (!isMetal || nameLC.includes("big") || nameLC.includes("railing"));

          if (isStructural) {
            // Structural surfaces: concrete walls, floors, pillars, ceilings, stone, panels, etc.
            // Force envMapIntensity to 0.0 to completely eliminate HDR sky reflections/color cast (no "HDR shadows").
            cloned.roughness = Math.max(cloned.roughness, 0.7);
            cloned.envMapIntensity = 0.0;
          } else {
            // Glass, metal, and other designed reflective materials get rich reflections.
            cloned.envMapIntensity = 1.0;
          }

          return cloned;
        });

        child.material = materials.length === 1 ? enhanced[0] : enhanced;

        // Performance: Disable matrix auto-update for static building parts
        child.matrixAutoUpdate = false;
        child.updateMatrix();
      }
    });
    return buildingClone;
  }, [building, currentBuilding]);

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();
    scene.traverse((child) => {
      if (child.isLight) {
        child.visible = false;
        return;
      }
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;
      const unit = unitMap[child.name];
      const statusKey = unit?.apartment_sold ? "sold" : "available";
      const cfg = UNIT_COLORS[statusKey];
      const defaults = DEFAULT_OPACITIES[statusKey];

      const baseInfo = parseColorAndOpacity(cfg.base, defaults.base);
      const hoverInfo = parseColorAndOpacity(cfg.hover, defaults.hover);
      const selectedInfo = parseColorAndOpacity(
        cfg.selected,
        defaults.selected,
      );

      // Assign material and pre-populate userData
      child.material = BASE_MATERIALS[statusKey].clone();
      child.userData = {
        ...child.userData,
        status: statusKey,
        unitName: child.name,
        baseColor: baseInfo.color,
        hoverColor: hoverInfo.color,
        selectedColor: selectedInfo.color,
        baseOpacity: baseInfo.opacity,
        hoverOpacity: hoverInfo.opacity,
        selectedOpacity: selectedInfo.opacity,
      };

      // Set renderOrder directly on child mesh so it renders on top of building walls/glass
      child.renderOrder = 10;

      // Each mesh gets its own edge material clone so GSAP can animate outlines independently
      const edges = getCachedEdges(child.geometry);
      const edgeLines = new THREE.LineSegments(
        edges,
        EDGE_MATERIAL_TEMPLATE.clone(),
      );
      edgeLines.raycast = () => {};
      edgeLines.frustumCulled = false;
      edgeLines.renderOrder = 11; // Ensure outlines render on top of hitbox color overlays
      child.add(edgeLines);
      child.userData[OUTLINE_KEY] = edgeLines;

      // Optimization: Static hitboxes don't need matrix updates
      child.matrixAutoUpdate = false;
      child.updateMatrix();
      edgeLines.matrixAutoUpdate = false;
      edgeLines.updateMatrix();
    });
    return scene;
  }, [glassHitbox, unitMap]);

  const animateMesh = useCallback((mesh, type = "base") => {
    const {
      baseColor,
      hoverColor,
      selectedColor,
      baseOpacity,
      hoverOpacity,
      selectedOpacity,
    } = mesh.userData;

    const targetColor =
      type === "selected"
        ? selectedColor
        : type === "hover"
          ? hoverColor
          : baseColor;
    const targetOpacity =
      type === "selected"
        ? selectedOpacity
        : type === "hover"
          ? hoverOpacity
          : baseOpacity;
    const outlineOpacity =
      type === "base" ? OUTLINE_BASE_OPACITY : OUTLINE_HOVER_OPACITY;

    gsap.killTweensOf([mesh.material.color, mesh.material]);
    gsap.to(mesh.material.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: ANIMATION_DURATION,
    });
    gsap.to(mesh.material, {
      opacity: targetOpacity,
      duration: ANIMATION_DURATION,
      ease: "power2.out",
    });

    const outline = mesh.userData[OUTLINE_KEY];
    if (outline) {
      gsap.killTweensOf(outline.material);
      gsap.to(outline.material, {
        opacity: outlineOpacity,
        duration: 0.2, // Minor transition duration
        ease: type === "base" ? "power2.in" : "power2.out",
      });
    }
  }, []);

  const focusCameraOnMesh = useCallback(
    (mesh) => {
      const controls = controlsRef.current;
      if (!controls || !mesh) return;

      if (rotationTween.current) {
        rotationTween.current.kill();
        rotationTween.current = null;
      }

      controls.enabled = false;
      const camera = controls.object;
      const center = controls.target.clone();

      mesh.updateMatrixWorld(true);
      mesh.getWorldPosition(_hitPoint);

      _dir.subVectors(_hitPoint, center);
      const targetAngle = Math.atan2(_dir.x, _dir.z);
      const currentAzimuth = controls.getAzimuthalAngle();
      const delta = Math.atan2(
        Math.sin(targetAngle - currentAzimuth),
        Math.cos(targetAngle - currentAzimuth),
      );
      const finalAzimuth = currentAzimuth + delta;

      const offset = camera.position.clone().sub(center);
      const state = { azimuth: currentAzimuth };
      let prevAzimuth = currentAzimuth;

      rotationTween.current = gsap.to(state, {
        azimuth: finalAzimuth,
        duration: CAMERA_FOCUS_DURATION,
        ease: "power3.inOut",
        onUpdate: () => {
          const frameDelta = state.azimuth - prevAzimuth;
          prevAzimuth = state.azimuth;
          offset.applyAxisAngle(_Y_AXIS, frameDelta);
          camera.position.copy(_temp.copy(center).add(offset));
          controls.update();
          invalidate();
        },
        onComplete: () => {
          controls.enabled = true;
          rotationTween.current = null;
        },
      });
    },
    [controlsRef, invalidate],
  );

  const handlePointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      if (isDragging || isMobile) return;

      const mesh = e.object;
      if (!mesh.userData.status) return;

      const isSelected =
        activeSelection?.buildingName === config.name &&
        activeSelection?.title === mesh.userData.unitName;
      if (isSelected) return;

      document.body.style.cursor = "pointer";
      const unit = unitMap[mesh.userData.unitName];
      if (unit) {
        dispatch(
          showTooltip({
            unit,
            x: e.nativeEvent.clientX,
            y: e.nativeEvent.clientY,
          }),
        );
      }
      animateMesh(mesh, "hover");
    },
    [unitMap, dispatch, isDragging, activeSelection, isMobile, animateMesh],
  );

  const handlePointerOut = useCallback(
    (e) => {
      const mesh = e.object;
      if (!mesh.userData.status) return;

      if (!isDragging) document.body.style.cursor = "default";
      const isSelected =
        activeSelection?.buildingName === config.name &&
        activeSelection?.title === mesh.userData.unitName;
      if (isSelected) return;

      animateMesh(mesh, "base");
    },
    [isDragging, activeSelection, animateMesh, config.name],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!e.object.userData.status || isDragging || isMobile) return;
      dispatch(
        updateTooltipPosition({
          x: e.nativeEvent.clientX,
          y: e.nativeEvent.clientY,
        }),
      );
    },
    [dispatch, isDragging, isMobile],
  );

  const handlePointerLeave = useCallback(() => {
    if (!isDragging) document.body.style.cursor = "default";
    dispatch(hideTooltip());
  }, [dispatch, isDragging]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.delta > MOUSE_DRAG_THRESHOLD) return;
      const unit = unitMap[e.object.userData.unitName];
      if (!unit) return;
      dispatch(
        isMobile
          ? setMobileSelectedUnit({ ...unit })
          : setSelectedUnit({ ...unit }),
      );
    },
    [unitMap, dispatch, isMobile],
  );

  const latestGlassSceneRef = useRef(glassScene);
  latestGlassSceneRef.current = glassScene;
  const hasNewEffectRunRef = useRef(false);

  useEffect(() => {
    hasNewEffectRunRef.current = true;

    // Only update highlights and camera focus for the active building
    // Inactive buildings don't need to waste cycles on selection changes
    if (isTransitioning || !isActiveBuilding) return;

    let focusObj = null;
    glassScene.traverse((child) => {
      if (!child.isMesh || !child.userData.status) return;

      const isSelected =
        activeSelection?.buildingName === config.name &&
        activeSelection?.title === child.userData.unitName;

      animateMesh(child, isSelected ? "selected" : "base");
      if (isSelected) focusObj = child;
    });

    if (focusObj) focusCameraOnMesh(focusObj);

    return () => {
      hasNewEffectRunRef.current = false;

      if (rotationTween.current) {
        rotationTween.current.kill();
        rotationTween.current = null;
      }

      // Dispose materials only when the component is unmounting or glassScene changes.
      // If selection changes, hasNewEffectRunRef is set to true synchronously in the next effect.
      const sceneToDispose = glassScene;
      setTimeout(() => {
        if (
          !hasNewEffectRunRef.current ||
          latestGlassSceneRef.current !== sceneToDispose
        ) {
          disposeSceneMaterials(sceneToDispose);
        }
      }, 0);
    };
  }, [
    activeSelection,
    glassScene,
    isTransitioning,
    isActiveBuilding,
    config.name,
    animateMesh,
    focusCameraOnMesh,
  ]);

  return {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handlePointerLeave,
    handleClick,
  };
};

export default useBuildingInstance;
