import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { solveFraming } from "./fit-camera";
import { HOME_CAMERA } from "@/utils/constant";
import { logger } from "@/utils/logger";

// Below this relative change in aspect the framing is left alone. Prevents a
// mobile browser's collapsing address bar, or a 1px resize, from yanking the
// camera back to its default position mid-gesture.
const ASPECT_REFRAME_THRESHOLD = 0.08;

/**
 * CameraRig — owns the camera framing and the orbit controls.
 *
 * The camera itself is created by <Canvas camera={...}> rather than by drei's
 * <PerspectiveCamera makeDefault>. That matters: with makeDefault, R3F renders
 * its own default camera until drei's layout effect swaps state.camera, and when
 * that swap lands drei's OrbitControls rebuilds itself
 * (useMemo(() => new OrbitControls(camera), [camera])), so the very first frames
 * show a different view. Creating the camera up front removes that entirely.
 */
const CameraRig = ({ controlsRef }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const aspect = size.height > 0 ? size.width / size.height : 0;

  const framing = useMemo(
    () => (aspect > 0 ? solveFraming({ camera: HOME_CAMERA, aspect }) : null),
    [aspect],
  );

  // Aspect the camera position was last seeded from, so we can tell a genuine
  // layout change from incidental jitter.
  const seededAspect = useRef(0);

  useLayoutEffect(() => {
    if (!framing || !camera) return;

    camera.fov = framing.fov;
    camera.near = HOME_CAMERA.near;
    camera.far = HOME_CAMERA.far;
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.minDistance = framing.minDistance;
      controls.maxDistance = framing.maxDistance;
    }

    const previous = seededAspect.current;
    const changedEnough =
      previous === 0 ||
      Math.abs(aspect - previous) / Math.max(aspect, previous) >
        ASPECT_REFRAME_THRESHOLD;

    // Only re-seed the position on first layout or a real layout change —
    // otherwise every incidental resize would discard the user's orbit.
    if (changedEnough) {
      camera.position.set(...framing.position);
      camera.lookAt(...HOME_CAMERA.target);
      if (controls) {
        controls.target.set(...HOME_CAMERA.target);
        controls.update();
      }
      seededAspect.current = aspect;
      logger.info("[CameraRig] Framing applied", {
        aspect: +aspect.toFixed(3),
        fov: framing.fov,
        distance: Math.round(framing.distance),
      });
    }
  }, [framing, camera, aspect, controlsRef]);

  // Keep the camera's own aspect in sync if R3F ever lags a resize.
  useEffect(() => {
    if (!camera || !aspect) return;
    if (camera.aspect !== aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.05}
      target={HOME_CAMERA.target}
      // Panning off on purpose: the orbit target is the measured centre of the
      // seven buildings, and letting it drift is what breaks the framing from
      // other directions.
      enablePan={false}
      enableZoom
      minDistance={framing?.minDistance}
      maxDistance={framing?.maxDistance}
      minPolarAngle={THREE.MathUtils.degToRad(HOME_CAMERA.minPolarDeg)}
      maxPolarAngle={THREE.MathUtils.degToRad(HOME_CAMERA.maxPolarDeg)}
    />
  );
};

export default CameraRig;
