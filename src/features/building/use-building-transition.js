import { useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useSelector, useDispatch } from "react-redux";
import { endTransition } from "../../store/slices/building-slice";
import { BUILDING_CONFIG } from "../../utils/constant";
import { useThree } from "@react-three/fiber";

// ── Reusable Three.js objects (module-level to avoid GC pressure) ──────────
const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _temp = new THREE.Vector3();

/**
 * Orchestrates the cinematic building transition animation.
 *
 * Listens for `isTransitioning` in Redux, then builds a GSAP timeline:
 *   Phase 1 — Old building revolves out along a circle arc.
 *   Phase 2 — Camera orbits to the new building's hero angle.
 *   Phase 3 — New building revolves in from a circle arc.
 *   Phase 4 — Camera settles, controls re-enabled, transition ends.
 *
 * @param {Object} params
 * @param {React.MutableRefObject<Object>} params.groupRefs - Map of building index → Three.js group ref
 * @param {React.MutableRefObject} params.controlsRef - OrbitControls ref
 */
const useBuildingTransition = ({ groupRefs, controlsRef }) => {
  const dispatch = useDispatch();
  const {
    isTransitioning,
    previousBuildingIndex,
    currentBuildingIndex,
    transitionDirection,
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

    // ── Clean up stranded buildings from interrupted transitions ─────────
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

    // Kill any in-progress timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    // ── Disable orbit controls during animation ──────────────────────────
    controls.enabled = false;

    // ── Prepare camera orbit ─────────────────────────────────────────────
    const camera = controls.object;
    const center = controls.target.clone();
    const offset = camera.position.clone().sub(center);
    const startAzimuth = controls.getAzimuthalAngle();

    const targetConfig = BUILDING_CONFIG[currentBuildingIndex];
    const targetAngle =
      targetConfig.heroAngle !== undefined
        ? targetConfig.heroAngle
        : startAzimuth; // Fallback: no rotation

    // Calculate shortest-path delta to prevent 270° rotations
    const delta = Math.atan2(
      Math.sin(targetAngle - startAzimuth),
      Math.cos(targetAngle - startAzimuth),
    );
    const finalAzimuth = startAzimuth + delta;

    const cameraState = { azimuth: startAzimuth };
    let prevAzimuth = startAzimuth;

    // ── Prepare Circular Carousel Path ─────────────────────────────────────
    // To ensure the transition is relative to the camera's current angle,
    // we set the carousel center "in front" of the building (towards the camera).
    const RADIUS = 80;
    const carouselCenter = new THREE.Vector3(
      RADIUS * Math.sin(startAzimuth),
      0,
      RADIUS * Math.cos(startAzimuth),
    );
    const centerToOrigin = new THREE.Vector3(0, 0, 0).sub(carouselCenter);

    const positionBuildingAtAngle = (group, angle) => {
      _temp.copy(centerToOrigin).applyAxisAngle(_Y_AXIS, angle);
      group.position.copy(carouselCenter).add(_temp);
      // Ensure the model does NOT rotate on its own axis, holding the same facing position
      group.rotation.y = 0;
    };

    const sign = transitionDirection === "next" ? -1 : 1;
    // 'next' (-1): Old slides Left (-45 deg), New enters from Right (+45 deg)
    // 'prev' (1): Old slides Right (+45 deg), New enters from Left (-45 deg)
    const TOTAL_ANGLE = Math.PI / 4; // 45° arc (very short slide distance)
    const oldTargetAngle = sign * TOTAL_ANGLE;
    const newStartAngle = -sign * TOTAL_ANGLE;

    // ── Initialize new building state (invisible, offset on arc) ──────────
    newGroup.visible = true;
    positionBuildingAtAngle(newGroup, newStartAngle);

    oldGroup.visible = true; // Crucial: React makes it inactive, so we must force visible
    positionBuildingAtAngle(oldGroup, 0);

    // ── Build Single Aggregated GSAP timeline ────────────────────────────
    const tl = gsap.timeline({
      onComplete: () => {
        // Clean up: hide old, reset positions and rotations
        oldGroup.visible = false;
        oldGroup.position.set(0, 0, 0);
        oldGroup.rotation.y = 0;

        newGroup.position.set(0, 0, 0);
        newGroup.rotation.y = 0;

        // Re-enable controls
        controls.enabled = true;
        timelineRef.current = null;

        dispatch(endTransition());
      },
    });

    const tlState = { progress: 0 };

    // Run a single combined tween for maximum performance (1 loop vs 5)
    tl.to(tlState, {
      progress: 1,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = tlState.progress;

        // 1. Camera Orbit
        const currentAzimuth = startAzimuth + delta * p;
        const frameDelta = currentAzimuth - prevAzimuth;
        prevAzimuth = currentAzimuth;

        offset.applyAxisAngle(_Y_AXIS, frameDelta);
        camera.position.copy(_temp.copy(center).add(offset));
        controls.target.copy(center);
        controls.update();

        // 2. Old Building (Slide Out)
        positionBuildingAtAngle(oldGroup, oldTargetAngle * p);

        // 3. New Building (Slide In)
        const currentAngle = newStartAngle * (1 - p);
        positionBuildingAtAngle(newGroup, currentAngle);

        // Call invalidate only ONCE per frame
        invalidate();
      },
    });

    timelineRef.current = tl;

    // Cleanup on unmount or if transition is interrupted
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
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
  ]);
};

export default useBuildingTransition;
