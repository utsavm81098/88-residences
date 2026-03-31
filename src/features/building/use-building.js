import { useCallback, useMemo, useRef } from "react";
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
import { useDispatch } from "react-redux";
import { showTooltip, hideTooltip, updateTooltipPosition } from "../../redux/reducers/tooltipSlice";

// Preload ALL models in the configuration to prevent loading flickering during switches
BUILDING_CONFIG.forEach((b) => {
  useGLTF.preload(b.model);
});

const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _hitPoint = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _temp = new THREE.Vector3();

const useBuilding = ({ config, controlsRef }) => {
  const dispatch = useDispatch();
  const building = useGLTF(config.model);
  const glassHitbox = useGLTF(config.hitbox);
  const rotationTween = useRef(null);
  // const pointerDownRef = useRef(null); // Track pointer down position and target
  const { invalidate } = useThree();

  const unitMap = useMemo(() => {
    const map = {};

    // Dynamically get units for the current building from the nested unitData object
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
      // ✅ STRIP BAKED-IN LIGHTS:
      // If the .glb model was exported with a sun/light facing the South side, it breaks our symmetry!
      // if (child.isLight) {
      //   child.visible = false;
      //   child.intensity = 0;
      //   child.castShadow = false;
      //   return;
      // }

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
        child.visible = false;
        return;
      }
      // Normalise status key; default to "available" for unknown values
      const statusKey = unit.status === "sold" ? "sold" : "available";
      const cfg = UNIT_COLORS[statusKey];
      // ── Main hitbox material (invisible by default, lighting-independent) ─────────────
      child.material = new THREE.MeshBasicMaterial({
        color: cfg.base.clone(),
        transparent: true,
        opacity: cfg.baseOpacity,
        // opacity: 0,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        blending: THREE.AdditiveBlending,
      });
      // Store references in userData for pointer handlers
      child.userData.status = unit.status;
      child.userData.unitName = child.name;
      child.userData.baseColor = cfg.base.clone();
      child.userData.hoverColor = cfg.hover.clone();
      child.userData.baseOpacity = cfg.baseOpacity;
      child.userData.hoverOpacity = cfg.hoverOpacity;

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

  const handlePointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      const mesh = e.object;
      if (!mesh.userData.status) return;
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
      // Kill any running tweens on this material
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
    [unitMap, dispatch],
  );
  // ── Pointer out → revert to base colour + hide outline ──────────────────────
  const handlePointerOut = useCallback(
    (e) => {
      const mesh = e.object;
      if (!mesh.userData.status) return;
      document.body.style.cursor = "default";
      dispatch(hideTooltip());
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
    [dispatch],
  );
  // ── Pointer move → update tooltip position ──────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    if (!e.object.userData.status) return;
    dispatch(updateTooltipPosition({ 
      x: e.nativeEvent.clientX, 
      y: e.nativeEvent.clientY 
    }));
  }, [dispatch]);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      const controls = controlsRef.current;
      if (!controls) return;
      const camera = controls.object;
      if (rotationTween.current) {
        rotationTween.current.eventCallback("onInterrupt", null);
        rotationTween.current.eventCallback("onComplete", null);
        rotationTween.current.kill();
        rotationTween.current = null;
      }
      controls.enabled = false;
      const center = controls.target.clone();
      // ✅ Reuse module-level vectors instead of `new THREE.Vector3()` per click
      e.object.getWorldPosition(_hitPoint);
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

  // const handlePointerDown = useCallback(
  //   (e) => {
  //     e.stopPropagation();

  //     // Hide tooltip immediately on pointer down (click or drag start)
  //     if (onTooltipHide) onTooltipHide();

  //     // Store pointer down info to differentiate click from drag
  //     pointerDownRef.current = {
  //       x: e.nativeEvent.clientX,
  //       y: e.nativeEvent.clientY,
  //       object: e.object,
  //     };
  //   },
  //   [onTooltipHide],
  // );

  // const handlePointerUp = useCallback(
  //   (e) => {
  //     e.stopPropagation();

  //     const downInfo = pointerDownRef.current;
  //     pointerDownRef.current = null;

  //     if (!downInfo) return;

  //     // Calculate distance moved
  //     const dx = e.nativeEvent.clientX - downInfo.x;
  //     const dy = e.nativeEvent.clientY - downInfo.y;
  //     const distance = Math.sqrt(dx * dx + dy * dy);

  //     // If moved more than threshold, it was a drag - let OrbitControls handle it
  //     if (distance > DRAG_THRESHOLD) {
  //       return;
  //     }

  //     // It was a click (not a drag) - rotate camera to face the unit
  //     const controls = controlsRef.current;
  //     if (!controls) return;

  //     const camera = controls.object;

  //     if (rotationTween.current) {
  //       rotationTween.current.eventCallback("onInterrupt", null);
  //       rotationTween.current.eventCallback("onComplete", null);
  //       rotationTween.current.kill();
  //       rotationTween.current = null;
  //     }

  //     controls.enabled = false;

  //     const center = controls.target.clone();

  //     // ✅ Reuse module-level vectors instead of `new THREE.Vector3()` per click
  //     downInfo.object.getWorldPosition(_hitPoint);
  //     _dir.subVectors(_hitPoint, center);

  //     const targetAngle = Math.atan2(_dir.x, _dir.z);
  //     const currentAzimuth = controls.getAzimuthalAngle();

  //     const delta = Math.atan2(
  //       Math.sin(targetAngle - currentAzimuth),
  //       Math.cos(targetAngle - currentAzimuth),
  //     );
  //     const finalAzimuth = currentAzimuth + delta;

  //     const offset = camera.position.clone().sub(center);
  //     const state = { azimuth: currentAzimuth };
  //     let prevAzimuth = currentAzimuth;

  //     const onFinish = () => {
  //       controls.enabled = true;
  //       rotationTween.current = null;
  //     };

  //     rotationTween.current = gsap.to(state, {
  //       azimuth: finalAzimuth,
  //       duration: 1.2,
  //       ease: "power3.inOut",

  //       onUpdate: () => {
  //         const frameDelta = state.azimuth - prevAzimuth;
  //         prevAzimuth = state.azimuth;

  //         // ✅ Reuse _Y_AXIS + _temp instead of new Vector3 every frame
  //         offset.applyAxisAngle(_Y_AXIS, frameDelta);
  //         camera.position.copy(_temp.copy(center).add(offset));

  //         controls.target.copy(center);
  //         controls.update();
  //         invalidate();
  //       },

  //       onComplete: onFinish,
  //       onInterrupt: onFinish,
  //     });
  //   },
  //   [controlsRef, invalidate],
  // );

  return {
    buildingScene,
    glassScene,
    handlePointerOver,
    handlePointerOut,
    handlePointerMove,
    handleClick,
    // handlePointerDown,
    // handlePointerUp,
  };
};

export default useBuilding;
