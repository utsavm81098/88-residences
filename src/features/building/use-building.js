import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useSelector, useDispatch } from "react-redux";
import { endTransition } from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { useThree, useFrame } from "@react-three/fiber";
import { preloadBackgroundModels } from "@/utils/preloader";

const WARMUP_FRAMES = 2;

/**
 * Orchestrates the cinematic building transition animation.
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

    controls.enabled = false;
    const camera = controls.object;
    const center = controls.target.clone();
    const offset = camera.position.clone().sub(center);
    const startAzimuth = controls.getAzimuthalAngle();

    const targetConfig = BUILDING_CONFIG[currentBuildingIndex];
    const targetAngle = targetConfig.heroAngle ?? startAzimuth;
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

    const tlState = { progress: 0 };

    timelineRef.current = gsap.to(tlState, {
      progress: 1,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = tlState.progress;

        // 1. Optimized Camera Rotation
        const currentAzimuth = startAzimuth + delta * p;
        camera.position.set(
          center.x + camRadius * Math.sin(currentAzimuth),
          camY,
          center.z + camRadius * Math.cos(currentAzimuth),
        );
        controls.update();

        // 2. Optimized Building Arc
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
        controls.enabled = true;
        dispatch(endTransition());
      },
    });

    return () => timelineRef.current?.kill();
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
