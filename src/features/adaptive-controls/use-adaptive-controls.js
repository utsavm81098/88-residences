import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setDragging } from "@/store/slices/drag-slice";
import { hideTooltip } from "@/store/slices/tooltip-slice";
import useResponsiveConfig from "@/hooks/use-responsive-config";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

const ORBIT_TRANSITION_DURATION = 0.6;

// Reusable scratch vectors to prevent GC pressure during frame-by-frame updates
const _dir = new THREE.Vector3();
const _targetPos = new THREE.Vector3();

export const useAdaptiveControls = (controlsRef) => {
  const config = useResponsiveConfig();
  const dispatch = useDispatch();
  const camera = useThree((state) => state.camera);

  // Animated orbit limits — start with config values, GSAP-animate on breakpoint change
  const [orbitLimits, setOrbitLimits] = useState({
    min: config.orbit.min,
    max: config.orbit.max,
  });
  const prevConfigRef = useRef(config);
  const tweenRef = useRef(null);

  useEffect(() => {
    const prevConfig = prevConfigRef.current;
    prevConfigRef.current = config;

    // Skip on initial render (same reference)
    if (prevConfig === config) return;

    const prevMin = prevConfig.orbit.min;
    const prevMax = prevConfig.orbit.max;
    const nextMin = config.orbit.min;
    const nextMax = config.orbit.max;

    const prevCameraZ = prevConfig.cameraZ;
    const nextCameraZ = config.cameraZ;

    // No change needed
    if (
      prevMin === nextMin &&
      prevMax === nextMax &&
      prevCameraZ === nextCameraZ
    )
      return;

    // Kill any in-progress orbit transition
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const controls = controlsRef.current;
    // Capture current camera distance to target to transition smoothly from it
    const startDistance = controls
      ? camera.position.distanceTo(controls.target)
      : prevCameraZ;

    const animated = {
      min: prevMin,
      max: prevMax,
      cameraZ: prevCameraZ,
    };

    tweenRef.current = gsap.to(animated, {
      min: nextMin,
      max: nextMax,
      cameraZ: nextCameraZ,
      duration: ORBIT_TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        setOrbitLimits({ min: animated.min, max: animated.max });

        if (controls) {
          const target = controls.target;

          // Calculate animated camera distance based on configuration difference
          const progress =
            nextCameraZ - prevCameraZ === 0
              ? 0
              : (animated.cameraZ - prevCameraZ) / (nextCameraZ - prevCameraZ);
          const targetDistance =
            startDistance + (nextCameraZ - prevCameraZ) * progress;

          const clampedDist = Math.max(
            animated.min,
            Math.min(animated.max, targetDistance),
          );

          // Calculate normalized direction vector from target to camera
          _dir.copy(camera.position).sub(target).normalize();

          // Calculate new camera position without allocating new Vector3 objects
          _targetPos.copy(target).addScaledVector(_dir, clampedDist);
          camera.position.copy(_targetPos);

          controls.update();
        }
      },
      onComplete: () => {
        tweenRef.current = null;
      },
    });

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
    };
  }, [config, controlsRef, camera]);

  const onStart = useCallback(() => {
    dispatch(setDragging(true));
    dispatch(hideTooltip());
  }, [dispatch]);

  const onEnd = useCallback(() => {
    dispatch(setDragging(false));
  }, [dispatch]);

  const POLAR = { min: 1.22, max: 1.56 };
  const TARGET = [0, 10, 0];

  return {
    config,
    orbitLimits,
    onStart,
    onEnd,
    POLAR,
    TARGET,
  };
};

export default useAdaptiveControls;
