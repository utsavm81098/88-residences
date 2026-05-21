import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSelector, useDispatch } from "react-redux";
import { endTransition } from "@/store/slices/building-slice";
import { setDragging } from "@/store/slices/drag-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { useThree, useFrame } from "@react-three/fiber";
import { preloadBackgroundModels } from "@/utils/preloader";
import { useIsMobile } from "@/hooks/use-mobile";
const WARMUP_FRAMES = 2;
/**
 * Orchestrates the cinematic building transition animation.
 */
const useBuildingTransition = ({ groupRefs, controlsRef }) => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const {
    isTransitioning,
    previousBuildingIndex,
    currentBuildingIndex,
    transitionDirection,
    selectedUnit,
  } = useSelector((state) => state.building);
  const { invalidate } = useThree();
  const timelineRef = useRef(null);
  useEffect(() => {
    if (!isTransitioning || previousBuildingIndex === null) return;
    const oldGroup = groupRefs.current[previousBuildingIndex];
    const newGroup = groupRefs.current[currentBuildingIndex];
    const controls = controlsRef.current;
    if (!oldGroup || !newGroup || !controls) {
      dispatch(endTransition());
      return;
    }
    // Clean up stranded buildings
    Object.keys(groupRefs.current).forEach((key) => {
      const idx = Number(key);
      if (idx !== previousBuildingIndex && idx !== currentBuildingIndex) {
        const group = groupRefs.current[key];
        if (group) {
          group.visible = false;
          group.position.set(0, 0, 0);
          group.rotation.y = 0;
        }
      }
    });
    if (timelineRef.current) {
      timelineRef.current.kill();
    }
    // Dispatch global pointer/mouse/touch release events to cancel active browser-level drags
    try {
      window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      window.dispatchEvent(new TouchEvent("touchend", { bubbles: true }));
    } catch (e) {
      // Ignore if some events are not supported in environment
    }
    controls.enabled = false;
    controls.enableDamping = false; // Disable damping temporarily so manual updates don't create inertia
    if (controls.state !== undefined) {
      controls.state = -1; // -1 corresponds to STATE.NONE in OrbitControls
    }
    // Stop all active OrbitControls inertia immediately to lock position
    if (controls.sphericalDelta) {
      controls.sphericalDelta.theta = 0;
      controls.sphericalDelta.phi = 0;
    }
    if (controls.panDelta) {
      controls.panDelta.set(0, 0, 0);
    }
    controls.update();
    // Reset Redux dragging state
    dispatch(setDragging(false));
    const camera = controls.object;
    const center = controls.target.clone();
    const offset = camera.position.clone().sub(center);
    const startAzimuth = controls.getAzimuthalAngle();
    const targetConfig = BUILDING_CONFIG[currentBuildingIndex];
    const isDesktop = !isMobile;
    const bypassHeroAngle = isMobile || (isDesktop && selectedUnit !== null);
    const targetAngle = bypassHeroAngle ? startAzimuth : (targetConfig.heroAngle ?? startAzimuth);
    const delta = Math.atan2(
      Math.sin(targetAngle - startAzimuth),
      Math.cos(targetAngle - startAzimuth),
    );
    const RADIUS = 80;
    const startSin = Math.sin(startAzimuth);
    const startCos = Math.cos(startAzimuth);
    const cx = RADIUS * startSin;
    const cz = RADIUS * startCos;
    const rx = -cx;
    const rz = -cz;
    // Fast camera constants
    const camRadius = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
    const camY = camera.position.y;
    const positionBuildingAtAngle = (group, angle) => {
      const s = Math.sin(angle);
      const c = Math.cos(angle);
      // Mathematically identical to applyAxisAngle but much faster
      const nx = rx * c + rz * s;
      const nz = -rx * s + rz * c;
      group.position.set(cx + nx, 0, cz + nz);
      group.rotation.y = 0;
    };
    const sign = transitionDirection === "next" ? -1 : 1;
    const TOTAL_ANGLE = Math.PI / 4;
    const oldTargetAngle = sign * TOTAL_ANGLE;
    const newStartAngle = -sign * TOTAL_ANGLE;
    newGroup.visible = true;
    positionBuildingAtAngle(newGroup, newStartAngle);
    oldGroup.visible = true;
    positionBuildingAtAngle(oldGroup, 0);
    const tl = gsap.timeline({
      onComplete: () => {
        // Enforce absolute silence in controls on complete to prevent lingering drift
        if (controls.sphericalDelta) {
          controls.sphericalDelta.theta = 0;
          controls.sphericalDelta.phi = 0;
        }
        if (controls.panDelta) {
          controls.panDelta.set(0, 0, 0);
        }
        if (controls.state !== undefined) {
          controls.state = -1; // Force reset to STATE.NONE
        }
        controls.update();
        // Restore OrbitControls settings
        controls.enableDamping = true;
        controls.enabled = true;
        dispatch(endTransition());
      },
    });
    timelineRef.current = tl;
    // Phase 1: Slide Buildings
    const tlState = { progress: 0 };
    tl.to(tlState, {
      progress: 1,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = tlState.progress;
        positionBuildingAtAngle(oldGroup, oldTargetAngle * p);
        positionBuildingAtAngle(newGroup, newStartAngle * (1 - p));
        invalidate();
      },
      onComplete: () => {
        oldGroup.visible = false;
        [oldGroup, newGroup].forEach((g) => {
          g.position.set(0, 0, 0);
          g.rotation.y = 0;
        });
        invalidate();
      },
    });
    // Phase 2: Rotate Camera to heroAngle (only if angle delta is significant)
    if (Math.abs(delta) > 0.001) {
      const camState = { angle: startAzimuth };
      tl.to(camState, {
        angle: startAzimuth + delta,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          const currentAzimuth = camState.angle;
          camera.position.set(
            center.x + camRadius * Math.sin(currentAzimuth),
            camY,
            center.z + camRadius * Math.cos(currentAzimuth),
          );
          controls.update();
          invalidate();
        },
      });
    }
    return () => {
      timelineRef.current?.kill();
      if (controlsRef.current) {
        controlsRef.current.enableDamping = true;
        controlsRef.current.enabled = true;
      }
    };
  }, [
    isTransitioning,
    previousBuildingIndex,
    currentBuildingIndex,
    transitionDirection,
    controlsRef,
    groupRefs,
    dispatch,
    invalidate,
    isMobile,
    selectedUnit,
  ]);
};
/**
 * Main hook for the BuildingModel component.
 * Manages global building state and transitions.
 */
export const useBuilding = ({ controlsRef }) => {
  const {
    currentBuilding,
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
  } = useSelector((state) => state.building);
  const groupRefs = useRef({});
  const [warmedUp, setWarmedUp] = useState(false);
  const frames = useRef(0);
  const [mountBackground, setMountBackground] = useState(false);
  useBuildingTransition({ groupRefs, controlsRef });
  useFrame(() => {
    if (warmedUp) return;
    frames.current++;
    if (frames.current >= WARMUP_FRAMES) setWarmedUp(true);
  });
  useEffect(() => {
    if (warmedUp) {
      preloadBackgroundModels();
      setMountBackground(true);
    }
  }, [warmedUp]);
  return {
    currentBuilding,
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
    groupRefs,
    warmedUp,
    mountBackground,
  };
};
export default useBuilding;