import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { UNIT_COLORS, OUTLINE_KEY, BUILDING_CONFIG } from "@/utils/constant";
import { useGLTF } from "@react-three/drei";
import { configureLoader } from "@/utils/preloader";
import { useThree } from "@react-three/fiber";
import { useDispatch, useSelector } from "react-redux";
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
const DRACO_PATH = "https://unpkg.com/three@0.172.0/examples/jsm/libs/draco/gltf/";

const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

// ── Shared Materials (Performance Optimization) ──────────────────────────────
const BASE_MATERIALS = {
  available: new THREE.MeshPhongMaterial({
    color: UNIT_COLORS.available.base,
    transparent: true,
    opacity: UNIT_COLORS.available.baseOpacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: false,
    shininess: 30,
    specular: new THREE.Color(0x111111),
  }),
  sold: new THREE.MeshPhongMaterial({
    color: UNIT_COLORS.sold.base,
    transparent: true,
    opacity: UNIT_COLORS.sold.baseOpacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    toneMapped: false,
    shininess: 30,
    specular: new THREE.Color(0x111111),
  }),
};

/**
 * Handles the logic for a single building instance.
 * Loads models, sets up hitboxes, and manages unit interactions.
 */
export const useBuildingInstance = ({ config, controlsRef }) => {
  const dispatch = useDispatch();
  const isDragging = useSelector((state) => state.drag.isDragging);
  const { selectedUnit, mobileSelectedUnit, inventory, isTransitioning } =
    useSelector((state) => state.building);

  const isMobile = useIsMobile();
  const invalidate = useThree((state) => state.invalidate);
  const rotationTween = useRef(null);

  const activeSelection = useMemo(() => {
    return isMobile ? mobileSelectedUnit : selectedUnit;
  }, [selectedUnit, mobileSelectedUnit, isMobile]);

  const building = useGLTF(config.model, DRACO_PATH, false, configureLoader);
  const glassHitbox = useGLTF(
    config.hitbox,
    DRACO_PATH,
    false,
    configureLoader,
  );

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
      if (child.isMesh) child.raycast = () => {};
    });
    return buildingClone;
  }, [building]);

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

      const unit = unitMap[child.name];
      const statusKey = unit?.apartment_sold ? "sold" : "available";
      const cfg = UNIT_COLORS[statusKey];

      child.material = BASE_MATERIALS[statusKey].clone();
      child.userData = {
        ...child.userData,
        status: statusKey,
        unitName: child.name,
        baseColor: cfg.base.clone(),
        hoverColor: cfg.hover.clone(),
        selectedColor: cfg.selected.clone(),
        baseOpacity: cfg.baseOpacity,
        hoverOpacity: cfg.hoverOpacity,
        selectedOpacity: cfg.selectedOpacity,
      };

      const edges = new THREE.EdgesGeometry(child.geometry, 15);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
      edgeLines.raycast = () => {};
      child.add(edgeLines);
      child.userData[OUTLINE_KEY] = edgeLines;
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
    const outlineOpacity = type === "base" ? 0.6 : 1.0;

    gsap.killTweensOf([mesh.material.color, mesh.material]);
    gsap.to(mesh.material.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.25,
    });
    gsap.to(mesh.material, {
      opacity: targetOpacity,
      duration: 0.25,
      ease: "power2.out",
    });

    const outline = mesh.userData[OUTLINE_KEY];
    if (outline) {
      gsap.killTweensOf(outline.material);
      gsap.to(outline.material, {
        opacity: outlineOpacity,
        duration: 0.2,
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
        duration: 1.2,
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

      const isSelected = activeSelection?.title === mesh.userData.unitName;
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
      const isSelected = activeSelection?.title === mesh.userData.unitName;
      if (isSelected) return;

      animateMesh(mesh, "base");
    },
    [isDragging, activeSelection, animateMesh],
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
      if (e.delta > 2) return;
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

  useEffect(() => {
    if (isTransitioning) return;
    let focusObj = null;
    glassScene.traverse((child) => {
      if (!child.isMesh || !child.userData.status) return;
      const isSelected = activeSelection
        ? activeSelection.title === child.name
        : false;
      animateMesh(child, isSelected ? "selected" : "base");
      if (isSelected) focusObj = child;
    });
    if (focusObj) focusCameraOnMesh(focusObj);
  }, [
    activeSelection,
    glassScene,
    isTransitioning,
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
