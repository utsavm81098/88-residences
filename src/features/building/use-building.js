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
          group.position.set(0, -1000, 0);
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
    const targetAngle = bypassHeroAngle
      ? startAzimuth
      : (targetConfig.heroAngle ?? startAzimuth);
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
        oldGroup.position.set(0, -1000, 0);
        oldGroup.rotation.y = 0;
        newGroup.position.set(0, 0, 0);
        newGroup.rotation.y = 0;
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
export const useBuilding = ({ controlsRef, sceneActive = true }) => {
  const {
    currentBuilding,
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
  } = useSelector((state) => state.building);
  const isMobile = useIsMobile();
  const groupRefs = useRef({});
  const [warmedUp, setWarmedUp] = useState(false);
  const frames = useRef(0);
  const [mountBackground, setMountBackground] = useState(false);

  // Latches true the first time Inventory actually becomes the visible
  // scene, and never reverts — same rationale/pattern as `warmedUp` just
  // above and HomeScene's own equivalent latch: <Building> is a
  // permanently-mounted sibling under the single shared Canvas (see
  // containers/scene-canvas/index.jsx's `<group visible={isInventory}>`),
  // so without this gate the DEFAULT building (index 0, "A") mounted — and
  // fetched its ~5MB GLB — on every cold load, including a cold landing on
  // Home that never shows Inventory at all.
  //
  // Initialized from `sceneActive` itself, so a COLD LANDING ON INVENTORY
  // is unaffected: hasBeenActive is already true on the very first render,
  // same render pass, so Building A mounts exactly when it always has.
  const [hasBeenActive, setHasBeenActive] = useState(sceneActive);
  useEffect(() => {
    if (sceneActive) setHasBeenActive(true);
  }, [sceneActive]);

  useBuildingTransition({ groupRefs, controlsRef });
  // REAL BUG FOUND HERE: this warmup counter used to run unconditionally
  // from the moment <Building> first mounted — which, since it's an
  // always-resident child of features/scene-environment (itself always
  // mounted under the unified canvas), is effectively "from app boot,
  // regardless of whether the user has ever opened Inventory." On desktop
  // it reached WARMUP_FRAMES (2 — about 33ms) almost immediately, which
  // flipped mountBackground true and mounted all 5 buildings' full-detail
  // models, hitbox glass overlays, per-unit materials and edge outlines
  // into the permanently-resident scene graph — even for a visitor who
  // stays on Home the whole session and never opens Inventory. That extra
  // scene-graph weight has a real per-frame traversal/cull cost
  // (Object3D.updateMatrixWorld, WebGLRenderer's visible-object walk) that
  // is paid on EVERY frame regardless of visibility, directly competing
  // with Home's own OrbitControls damping for CPU time — reported as
  // "camera isn't smooth" and "heavy load, lagging" while looking at Home,
  // which never needed any of this mounted. Gating the counter on
  // `sceneActive` (Inventory actually having been the visible view at
  // least once) means Home stays light for as long as the user stays on
  // it; the instant Inventory is opened for the first time, this reaches
  // WARMUP_FRAMES within ~2 frames same as before, so the "other buildings
  // preload for instant switching" behavior still kicks in immediately
  // once the user has shown any intent to browse Inventory — it just no
  // longer runs before they ever asked for it.
  useFrame(() => {
    if (warmedUp || !sceneActive) return;
    frames.current++;
    if (frames.current >= WARMUP_FRAMES) setWarmedUp(true);
  });
  useEffect(() => {
    if (!warmedUp) return;

    // Desktop only: preload the OTHER buildings' model files in the background
    // (network fetch + parse) for instant transitions. This used to run
    // unconditionally on the assumption that it's "safe" because the parsed
    // data doesn't hit GPU until mounted — true for VRAM, but the parsed
    // geometry/texture data still lands in JS heap via useGLTF's permanent
    // cache regardless of device. On mobile, where mountBackground below
    // already guarantees these buildings never mount/render, preloading them
    // anyway just grows JS heap for buildings that will never be shown,
    // stacking on top of whatever Home's scene already holds resident (see
    // containers/keep-alive-outlet/use-keep-alive-outlet.js) — the same
    // total-process-memory budget that crashed low-end mobile.
    if (!isMobile) {
      preloadBackgroundModels();
    }

    // On mobile: keep mountBackground false to prevent loading inactive buildings into the scene graph.
    // This saves maximum GPU memory. They will only mount/render on-demand when active.
    // On desktop: mount immediately for instant transitions.
    setMountBackground(!isMobile);
  }, [warmedUp, isMobile]);
  return {
    currentBuilding,
    currentBuildingIndex,
    previousBuildingIndex,
    isTransitioning,
    groupRefs,
    warmedUp,
    mountBackground,
    hasBeenActive,
  };
};
export default useBuilding;
