import React, { useEffect, useLayoutEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useThree } from "@react-three/fiber";
import { useTranslation } from "react-i18next";
import { OrbitControls } from "@react-three/drei";
import useAdaptiveControls from "./use-adaptive-controls";

// Exported so other consumers that need to compensate for this same overlay
// (e.g. components/ui/scene-loading-indicator, positioned via
// containers/scene-canvas's own hook) share one source of truth instead of
// re-hardcoding 380 — see containers/inventory/index.jsx's `w-[380px]`
// panel, the actual DOM element this offsets for.
export const SIDEBAR_WIDTH = 380;

const AdaptiveControls = ({ controlsRef, active = true }) => {
  const { orbitLimits, onStart, onEnd, POLAR, TARGET, config } =
    useAdaptiveControls(controlsRef);
  const snapHeight = useSelector((state) => state.building.snapHeight);
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const syncCameraAndControls = useCallback(() => {
    if (!active || !camera) return;

    if (size.width >= 1024) {
      // Sidebar overlay flips sides with the flex-row layout's inherited
      // `dir` — right in RTL (he), left in LTR (en) — so the compensating
      // view-offset shift must flip sign to match, or the model shifts the
      // wrong way instead of re-centering in the visible region.
      camera.setViewOffset(
        size.width,
        size.height,
        (isRtl ? 1 : -1) * Math.round(SIDEBAR_WIDTH / 2),
        0,
        size.width,
        size.height,
      );
    } else if (snapHeight > 0) {
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        Math.round(snapHeight / 2),
        size.width,
        size.height,
      );
    } else {
      camera.clearViewOffset?.();
    }

    camera.position.set(0, 10, config.cameraZ);
    camera.lookAt(...TARGET);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(...TARGET);
      controls.object.position.set(0, 10, config.cameraZ);
      controls.object.lookAt(...TARGET);
      controls.minPolarAngle = POLAR.min;
      controls.maxPolarAngle = POLAR.max;
      controls.minDistance = orbitLimits.min;
      controls.maxDistance = orbitLimits.max;
      if (controls.sphericalDelta) {
        controls.sphericalDelta.theta = 0;
        controls.sphericalDelta.phi = 0;
      }
      if (controls.panDelta) {
        controls.panDelta.set(0, 0, 0);
      }
      controls.update();
    }
  }, [
    active,
    camera,
    size.width,
    isRtl,
    size.height,
    snapHeight,
    config.cameraZ,
    controlsRef,
    TARGET,
    POLAR,
    orbitLimits,
  ]);

  useLayoutEffect(() => {
    syncCameraAndControls();
  }, [syncCameraAndControls]);

  useEffect(() => {
    syncCameraAndControls();
  }, [syncCameraAndControls]);

  useEffect(() => {
    return () => {
      camera.clearViewOffset?.();
    };
  }, [camera]);

  // Kept mounted (never `return null`) even while inactive, mirroring
  // features/home-scene/camera-rig.jsx's OrbitControls. Unmounting drei's
  // <OrbitControls> destroys the underlying three-stdlib instance and tears
  // down its pointer/wheel DOM listeners; remounting on every single
  // Home <-> Inventory toggle rebuilds all of that for no reason, leaves
  // `controlsRef.current` transiently null for anything reading it during
  // the swap (focusCameraOnMesh, direction-label's moveCamera), and is a
  // real source of mobile touch-gesture glitches on repeated navigation.
  // `enabled`/`makeDefault` below already fully gate it off while inactive.
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault={active}
      enabled={active}
      enableDamping
      dampingFactor={0.05}
      target={TARGET}
      enablePan={false}
      enableZoom
      rotateSpeed={0.5}
      minPolarAngle={POLAR.min}
      maxPolarAngle={POLAR.max}
      minDistance={orbitLimits.min}
      maxDistance={orbitLimits.max}
      onStart={onStart}
      onEnd={onEnd}
    />
  );
};

export default AdaptiveControls;
