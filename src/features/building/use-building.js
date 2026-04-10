import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import {
  unitData,
  UNIT_COLORS,
  OUTLINE_KEY,
  BUILDING_CONFIG,
} from "../../utils/constant";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useDispatch, useSelector } from "react-redux";
import {
  showTooltip,
  hideTooltip,
  updateTooltipPosition,
} from "../../store/slices/tooltip-slice";
import {
  setSelectedUnit,
  setMobileSelectedUnit,
} from "../../store/slices/building-slice";
import { useIsMobile } from "../../hooks/use-mobile";

BUILDING_CONFIG.forEach((b) => {
  useGLTF.preload(b.model);
});
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

// ── Shared Materials (Performance Optimization) ──────────────────────────────
// Reusing these for all non-interactive states to reduce draw calls
const BASE_MATERIALS = {
  available: new THREE.MeshBasicMaterial({
    color: UNIT_COLORS.available.base,
    transparent: true,
    opacity: UNIT_COLORS.available.baseOpacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide, // Optimized from DoubleSide
    toneMapped: false,
  }),
  sold: new THREE.MeshBasicMaterial({
    color: UNIT_COLORS.sold.base,
    transparent: true,
    opacity: UNIT_COLORS.sold.baseOpacity,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide, // Optimized from DoubleSide
    toneMapped: false,
  }),
};
const useBuilding = ({ config, controlsRef }) => {
  const dispatch = useDispatch();
  const isDragging = useSelector((state) => state.drag.isDragging);
  const { selectedUnit, mobileSelectedUnit } = useSelector(
    (state) => state.building,
  );

  const isMobile = useIsMobile();

  // Determine which unit should be highlighted based on viewport
  const activeSelection = useMemo(() => {
    return isMobile ? mobileSelectedUnit : selectedUnit;
  }, [selectedUnit, mobileSelectedUnit, isMobile]);

  const building = useGLTF(config.model);
  const glassHitbox = useGLTF(config.hitbox);
  const rotationTween = useRef(null);
  const { invalidate } = useThree();

  const unitMap = useMemo(() => {
    const map = {};
    const buildingUnits = unitData[config.name] || [];
    buildingUnits.forEach((unit) => {
      map[unit.name] = unit;
    });
    return map;
  }, [config.name]);

  const buildingScene = useMemo(() => {
    const buildingClone = building.scene.clone();
    // const clonedMaterials = new Map();
    buildingClone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
    });
    return buildingClone;
  }, [building]);

  const glassScene = useMemo(() => {
    const scene = glassHitbox.scene.clone();
    scene.traverse((child) => {
      // Strip any lights exported within the hitbox GLB to prevent them from breaking the scene lighting
      if (child.isLight) {
        child.visible = false;
        child.intensity = 0;
        child.castShadow = false;
        return;
      }
      if (!child.isMesh) return;
      // Prevent hitboxes from casting or receiving shadows to preserve the building's original lighting
      child.castShadow = false;
      child.receiveShadow = false;
      const unit = unitMap[child.name];
      if (!unit) {
        // child.visible = false;
        child.material = new THREE.MeshBasicMaterial({
          color: UNIT_COLORS.available.base,
          transparent: true,
          opacity: UNIT_COLORS.available.baseOpacity,
          // opacity: 0,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
          toneMapped: false,
          blending: THREE.NormalBlending,
        });
        return;
      }
      // Normalise status key; default to "available" for unknown values
      const statusKey = unit.status === "sold" ? "sold" : "available";
      const cfg = UNIT_COLORS[statusKey];

      // ── Assign Shared Base Material (Initial State) ─────────────
      // We start with a shared material for performance.
      // Individual materials are assigned dynamically during interaction.
      child.material = BASE_MATERIALS[statusKey].clone();

      // Store references in userData for pointer handlers
      child.userData.status = unit.status;
      child.userData.unitName = child.name;
      child.userData.baseColor = cfg.base.clone();
      child.userData.hoverColor = cfg.hover.clone();
      child.userData.selectedColor = cfg.selected.clone();
      child.userData.baseOpacity = cfg.baseOpacity;
      child.userData.hoverOpacity = cfg.hoverOpacity;
      child.userData.selectedOpacity = cfg.selectedOpacity;
      // ── Edge border lines (invisible by default) ──────────────
      const edges = new THREE.EdgesGeometry(child.geometry, 15);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        // opacity: 0,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
      edgeLines.raycast = () => {};
      edgeLines.name = `${child.name}_edges`;
      child.add(edgeLines);
      child.userData[OUTLINE_KEY] = edgeLines;
    });
    return scene;
  }, [glassHitbox, unitMap]);

  const focusCameraOnMesh = useCallback(
    (mesh) => {
      const controls = controlsRef.current;
      if (!controls || !mesh) return;
      const camera = controls.object;

      if (rotationTween.current) {
        rotationTween.current.eventCallback("onInterrupt", null);
        rotationTween.current.eventCallback("onComplete", null);
        rotationTween.current.kill();
        rotationTween.current = null;
      }
      controls.enabled = false;
      const center = controls.target.clone();

      // Use absolute update to calculate correct world positions for rotation
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

      const onFinish = () => {
        controls.enabled = true;
        rotationTween.current = null;
      };

      rotationTween.current = gsap.to(state, {
        azimuth: finalAzimuth,
        duration: 1.2,
        ease: "power3.inOut",
        onUpdate: () => {
          const frameDelta = state.azimuth - prevAzimuth;
          prevAzimuth = state.azimuth;
          // ✅ Reuse _Y_AXIS + _temp instead of new Vector3 every frame
          offset.applyAxisAngle(_Y_AXIS, frameDelta);
          camera.position.copy(_temp.copy(center).add(offset));
          controls.target.copy(center);
          controls.update();
          invalidate();
        },
        onComplete: onFinish,
        onInterrupt: onFinish,
      });
    },
    [controlsRef, invalidate],
  );

  const handlePointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      if (isDragging) return;

      const mesh = e.object;
      if (!mesh.userData.status) return;

      const isSelected =
        activeSelection && activeSelection.name === mesh.userData.unitName;
      if (isSelected || isMobile) return;

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

      gsap.killTweensOf(mesh.material.color);
      gsap.killTweensOf(mesh.material);
      // Animate fill colour to hover
      gsap.to(mesh.material.color, {
        r: mesh.userData.hoverColor.r,
        g: mesh.userData.hoverColor.g,
        b: mesh.userData.hoverColor.b,
        duration: 0.25,
      });
      gsap.to(mesh.material, {
        opacity: mesh.userData.hoverOpacity,
        duration: 0.25,
        ease: "power2.out",
      });
      // ── Brighten edge borders on hover ──────────────────────────────────────
      const outline = mesh.userData[OUTLINE_KEY];
      if (outline) {
        gsap.killTweensOf(outline.material);
        gsap.to(outline.material, {
          opacity: 1.0,
          duration: 0.22,
          ease: "power2.out",
        });
      }
    },
    [unitMap, dispatch, isDragging, activeSelection, isMobile],
  );
  // ── Pointer out → revert to base colour + hide outline ──────────────────────
  const handlePointerOut = useCallback(
    (e) => {
      const mesh = e.object;
      if (!mesh.userData.status) return;

      const isSelected =
        activeSelection && activeSelection.name === mesh.userData.unitName;

      if (!isDragging) {
        document.body.style.cursor = "default";
      }
      dispatch(hideTooltip());

      if (isSelected) return;

      gsap.killTweensOf(mesh.material.color);
      gsap.killTweensOf(mesh.material);
      // Revert fill colour to base
      gsap.to(mesh.material.color, {
        r: mesh.userData.baseColor.r,
        g: mesh.userData.baseColor.g,
        b: mesh.userData.baseColor.b,
        duration: 0.25,
      });
      gsap.to(mesh.material, {
        opacity: mesh.userData.baseOpacity,
        duration: 0.25,
        ease: "power2.out",
      });
      // ── Dim edge borders back to base ──────────────────────────────────────
      const outline = mesh.userData[OUTLINE_KEY];
      if (outline) {
        gsap.killTweensOf(outline.material);
        gsap.to(outline.material, {
          opacity: 0.6,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    },
    [dispatch, isDragging, activeSelection],
  );
  // ── Pointer move → update tooltip position ──────────────────────────────────
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

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.delta > 2) return;
      const unit = unitMap[e.object.userData.unitName];
      if (!unit) return;
      if (isMobile) {
        dispatch(setMobileSelectedUnit({ ...unit }));
      } else {
        dispatch(setSelectedUnit({ ...unit }));
      }
    },
    [unitMap, dispatch, isMobile],
  );

  const updateUnitColor = useCallback(
    (unit) => {
      let focusObj = null;
      glassScene.traverse((child) => {
        if (!child.isMesh || !child.userData.status) return;
        const isSelected = unit ? unit.name === child.name : false;

        if (isSelected) {
          focusObj = child;
          gsap.killTweensOf(child.material.color);
          gsap.killTweensOf(child.material);
          gsap.to(child.material.color, {
            r: child.userData.selectedColor.r,
            g: child.userData.selectedColor.g,
            b: child.userData.selectedColor.b,
            duration: 0.25,
          });
          gsap.to(child.material, {
            opacity: child.userData.selectedOpacity,
            duration: 0.25,
            ease: "power2.out",
          });
          const outline = child.userData[OUTLINE_KEY];
          if (outline) {
            gsap.killTweensOf(outline.material);
            gsap.to(outline.material, {
              opacity: 1.0,
              duration: 0.22,
              ease: "power2.out",
            });
          }
        } else {
          gsap.killTweensOf(child.material.color);
          gsap.killTweensOf(child.material);
          gsap.to(child.material.color, {
            r: child.userData.baseColor.r,
            g: child.userData.baseColor.g,
            b: child.userData.baseColor.b,
            duration: 0.25,
          });
          gsap.to(child.material, {
            opacity: child.userData.baseOpacity,
            duration: 0.25,
            ease: "power2.out",
          });
          const outline = child.userData[OUTLINE_KEY];
          if (outline) {
            gsap.killTweensOf(outline.material);
            gsap.to(outline.material, {
              opacity: 0.6,
              duration: 0.2,
              ease: "power2.in",
            });
          }
        }
      });
      if (focusObj) {
        focusCameraOnMesh(focusObj);
      }
    },
    [glassScene, focusCameraOnMesh],
  );

  useEffect(() => {
    updateUnitColor(activeSelection);
  }, [activeSelection, updateUnitColor]);

  return {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handleClick,
  };
};
export default useBuilding;
