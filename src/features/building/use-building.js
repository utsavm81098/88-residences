import { useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { useSelector, useDispatch } from "react-redux";
import { endTransition } from "@/store/slices/building-slice";
import { BUILDING_CONFIG } from "@/utils/constant";
import { useThree } from "@react-three/fiber";

const _Y_AXIS = new THREE.Vector3(0, 1, 0);
const _temp = new THREE.Vector3();

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
    const delta = Math.atan2(Math.sin(targetAngle - startAzimuth), Math.cos(targetAngle - startAzimuth));
    const finalAzimuth = startAzimuth + delta;

    const RADIUS = 80;
    const carouselCenter = new THREE.Vector3(RADIUS * Math.sin(startAzimuth), 0, RADIUS * Math.cos(startAzimuth));
    const centerToOrigin = new THREE.Vector3(0, 0, 0).sub(carouselCenter);

    const positionBuildingAtAngle = (group, angle) => {
      _temp.copy(centerToOrigin).applyAxisAngle(_Y_AXIS, angle);
      group.position.copy(carouselCenter).add(_temp);
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
    let prevAzimuth = startAzimuth;

    timelineRef.current = gsap.to(tlState, {
      progress: 1,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => {
        const p = tlState.progress;
        const currentAzimuth = startAzimuth + delta * p;
        offset.applyAxisAngle(_Y_AXIS, currentAzimuth - prevAzimuth);
        prevAzimuth = currentAzimuth;
        camera.position.copy(_temp.copy(center).add(offset));
        controls.update();

        positionBuildingAtAngle(oldGroup, oldTargetAngle * p);
        positionBuildingAtAngle(newGroup, newStartAngle * (1 - p));
        invalidate();
      },
      onComplete: () => {
        oldGroup.visible = false;
        [oldGroup, newGroup].forEach(g => {
          g.position.set(0, 0, 0);
          g.rotation.y = 0;
        });
        controls.enabled = true;
        dispatch(endTransition());
      }
    });

    return () => timelineRef.current?.kill();
  }, [isTransitioning, previousBuildingIndex, currentBuildingIndex, transitionDirection, controlsRef, groupRefs, dispatch, invalidate]);
};

/**
 * Main hook for the BuildingModel component.
 * Manages global building state and transitions.
 */
export const useBuilding = ({ controlsRef }) => {
  const { currentBuilding } = useSelector((state) => state.building);
  const groupRefs = useRef({});

  useBuildingTransition({ groupRefs, controlsRef });

  return {
    currentBuilding,
    groupRefs,
  };
};

export default useBuilding;
