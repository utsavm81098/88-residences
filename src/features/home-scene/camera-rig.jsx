import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { solveFraming } from "./fit-camera";
import { AUTO_ROTATE_SPEED, useAutoRotateHint } from "./use-auto-rotate-hint";
import { HOME_CAMERA, HOME_PAN_BOUNDARY } from "@/utils/constant";

// Below this relative change in aspect the framing is left alone. Prevents a
// mobile browser's collapsing address bar, or a 1px resize, from yanking the
// camera back to its default position mid-gesture.
const ASPECT_REFRAME_THRESHOLD = 0.08;

// Pan speed at the reference (initial-framing) distance. OrbitControls' own
// pan() scales the world-space pan distance linearly by the current
// camera-target distance (targetDistance = offset.length() * tan(fov/2)) —
// so with a single fixed panSpeed, the same drag gesture moves the pivot
// noticeably farther in world units when zoomed out than when zoomed in.
// Verified live: at distance 266 a 100px drag moved the pivot 2.85 units; at
// the max-zoom-out distance 293 the identical drag moved it 3.13 units — a
// ratio that tracks the distance ratio almost exactly. Across the full
// zoom range (minDistanceScale 0.6 to maxDistanceScale 1.1) that's a ~1.8x
// sensitivity swing: panning feels controlled zoomed in, but a small swipe
// flings the pivot (and camera) toward the plot boundary when zoomed out.
// BASE_PAN_SPEED is the value used AT framing.distance; the useFrame below
// rescales controls.panSpeed every frame by (framing.distance / currentDistance)
// so world-units-per-pixel stays constant at every zoom level instead of
// scaling with it.
const BASE_PAN_SPEED = 1.5;

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
const CameraRigImpl = ({ controlsRef, active = true }) => {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  // touch-action: none for the shared canvas is now owned in exactly one
  // place — the wrapping <div style={{ touchAction: "none" }}> in
  // containers/scene-canvas/index.jsx — because it must hold regardless of
  // which scene is active. This component used to set it here imperatively
  // on gl.domElement, but CameraRig only mounts while Home is active
  // ({active && <CameraRig .../>} in features/home-scene/index.jsx), so its
  // cleanup unset it the instant Home deactivated, with nothing on the
  // Inventory side ever setting it back — leaving Inventory's touch-action
  // at the browser default ("auto") on mobile: one-finger drag scrolled the
  // page instead of orbiting, and pinch-zoom fought the browser's native
  // viewport zoom instead of driving OrbitControls' dolly. See that file's
  // comment for the full explanation.
  const aspect = size.height > 0 ? size.width / size.height : 0;

  // Used only to pick the pan boundary below — enablePan, zoom range, and the
  // clamp/speed logic itself are otherwise identical on every device.
  const isMobileOrTablet = aspect > 0 && aspect < 1.35;

  const framing = useMemo(
    () => (aspect > 0 ? solveFraming({ camera: HOME_CAMERA, aspect }) : null),
    [aspect],
  );

  // Zoom limits: same formula on every device (framing.distance scaled by
  // HOME_CAMERA.minDistanceScale/maxDistanceScale, capped at maxDistanceCap),
  // so min/max zoom mean the same thing on a phone as on a desktop.
  const zoomLimits = useMemo(() => {
    if (!framing) return { minDistance: undefined, maxDistance: undefined };
    return {
      minDistance: framing.minDistance,
      maxDistance: framing.maxDistance,
    };
  }, [framing]);

  // Pan boundary: mobile/tablet gets a looser box (see HOME_PAN_BOUNDARY's
  // mobile* fields) — a two-finger touch pan felt too tight against the
  // 7-building cluster at the desktop box's bounds. Everything else about
  // panning (that it's on, its speed rescaling, the clamp mechanism itself)
  // stays identical across devices; only where the wall sits differs.
  const panBoundary = useMemo(
    () =>
      isMobileOrTablet
        ? {
            minX: HOME_PAN_BOUNDARY.mobileMinX,
            maxX: HOME_PAN_BOUNDARY.mobileMaxX,
            minZ: HOME_PAN_BOUNDARY.mobileMinZ,
            maxZ: HOME_PAN_BOUNDARY.mobileMaxZ,
            minY: HOME_PAN_BOUNDARY.mobileMinY,
            maxY: HOME_PAN_BOUNDARY.mobileMaxY,
          }
        : HOME_PAN_BOUNDARY,
    [isMobileOrTablet],
  );

  // Track previous active state to re-seed framing on route return
  const wasActiveRef = useRef(false);
  const seededAspect = useRef(0);
  const activationFramesRef = useRef(0);

  const applyFraming = useCallback(
    (force = false) => {
      if (!active || !framing || !camera) return;

      const previous = seededAspect.current;
      const isReturning = !wasActiveRef.current;
      const changedEnough =
        force ||
        isReturning ||
        previous === 0 ||
        Math.abs(aspect - previous) / Math.max(aspect, previous) >
          ASPECT_REFRAME_THRESHOLD;

      if (changedEnough) {
        camera.clearViewOffset?.();
        camera.fov = framing.fov;
        camera.near = HOME_CAMERA.near;
        camera.far = HOME_CAMERA.far;
        camera.position.set(...framing.position);
        camera.lookAt(...HOME_CAMERA.target);
        camera.updateProjectionMatrix();

        const controls = controlsRef.current;
        if (controls) {
          controls.target.set(...HOME_CAMERA.target);
          controls.object.position.set(...framing.position);
          controls.object.lookAt(...HOME_CAMERA.target);
          if (controls.target0) controls.target0.set(...HOME_CAMERA.target);
          if (controls.position0) controls.position0.set(...framing.position);
          controls.minPolarAngle = THREE.MathUtils.degToRad(HOME_CAMERA.minPolarDeg);
          controls.maxPolarAngle = THREE.MathUtils.degToRad(HOME_CAMERA.maxPolarDeg);
          if (zoomLimits.minDistance && zoomLimits.maxDistance) {
            controls.minDistance = zoomLimits.minDistance;
            controls.maxDistance = zoomLimits.maxDistance;
          }
          controls.enablePan = true;
          controls.enableZoom = true;
          controls.enableRotate = true;
          controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          };
          if (controls._sphericalDelta) {
            controls._sphericalDelta.set(0, 0, 0);
          }
          if (controls._panOffset) {
            controls._panOffset.set(0, 0, 0);
          }
          if (controls.sphericalDelta) {
            controls.sphericalDelta.theta = 0;
            controls.sphericalDelta.phi = 0;
          }
          if (controls.panDelta) {
            controls.panDelta.set(0, 0, 0);
          }
          controls.saveState?.();
          controls.update();
        }
        seededAspect.current = aspect;
        wasActiveRef.current = true;
      }
    },
    [active, framing, zoomLimits, camera, aspect, controlsRef],
  );

  useLayoutEffect(() => {
    if (!active) {
      wasActiveRef.current = false;
      activationFramesRef.current = 0;
      return;
    }
    camera.clearViewOffset?.();
    applyFraming(true);
    activationFramesRef.current = 20; // Re-sync smoothly across the 300ms mobile canvas expansion
  }, [active, aspect, applyFraming, camera]);

  useEffect(() => {
    if (!active) return;
    // Guaranteed pass after OrbitControls ref is attached
    applyFraming(true);
  }, [active, aspect, applyFraming]);

  // Keep the camera's own aspect in sync if R3F ever lags a resize.
  useEffect(() => {
    if (!camera || !aspect || !active) return;
    if (camera.aspect !== aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect, active]);

  // Clamps controls.target in place to HOME_PAN_BOUNDARY and, if it moved,
  // shifts camera.position by the same correction vector so the camera-target
  // offset (distance/angles) is preserved exactly.
  const clampPanTarget = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const t = controls.target;
    const cx = THREE.MathUtils.clamp(t.x, panBoundary.minX, panBoundary.maxX);
    const cy = THREE.MathUtils.clamp(t.y, panBoundary.minY, panBoundary.maxY);
    const cz = THREE.MathUtils.clamp(t.z, panBoundary.minZ, panBoundary.maxZ);

    if (t.x !== cx || t.y !== cy || t.z !== cz) {
      const dx = cx - t.x;
      const dy = cy - t.y;
      const dz = cz - t.z;
      t.x = cx;
      t.y = cy;
      t.z = cz;
      controls.object.position.x += dx;
      controls.object.position.y += dy;
      controls.object.position.z += dz;

      if (controls._panOffset) {
        controls._panOffset.set(0, 0, 0);
      }
    }
  }, [controlsRef, panBoundary]);

  // Per-frame boundary clamp & mobile activation transition sync
  useFrame(() => {
    if (!active) return;
    if (activationFramesRef.current > 0) {
      activationFramesRef.current -= 1;
      applyFraming(true);
    }
    clampPanTarget();
  });

  // Counter-scales panSpeed by the current zoom distance so world-units-per-
  // pixel stays constant regardless of zoom — see BASE_PAN_SPEED comment.
  // Driven off OrbitControls' own 'change' event (fires synchronously inside
  // the real wheel/pointer event handler) rather than the useFrame above, so
  // panSpeed is current from the very first frame of a new gesture instead
  // of lagging by up to one frame.
  const updatePanSpeed = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls || !framing?.distance) return;

    const distance = controls.object.position.distanceTo(controls.target);
    if (distance > 0) {
      controls.panSpeed = BASE_PAN_SPEED * (framing.distance / distance);
    }
  }, [controlsRef, framing]);

  // controls.addEventListener (three.js EventDispatcher), not the DOM
  // listener above: OrbitControls dispatches 'change' from inside its own
  // update() whenever pan, dolly (wheel/pinch zoom), OR damping actually move
  // the camera — one hook point that keeps panSpeed current for every way
  // distance can change, not just pan gestures. Fires once up front too, so
  // a non-default initial distance (e.g. mobile framing) starts correct.
  //
  // Also sets controlsChangedRef so the useFrame clamp above knows to run
  // this frame — avoids calling controls.update() every idle frame.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleChange = () => {
      updatePanSpeed();
    };

    updatePanSpeed();
    controls.addEventListener("change", handleChange);
    return () => controls.removeEventListener("change", handleChange);
  }, [controlsRef, updatePanSpeed]);

  // Idle auto-rotate — see ./use-auto-rotate-hint.js for the full timing
  // sequence and the memory-leak audit notes. Pure side effect: talks to
  // controlsRef imperatively, same as CameraRig's own onReady/isReady wiring
  // elsewhere in this feature.
  // `enabled` is gated on route activity: frameloop="never" stops the render
  // loop but not setTimeout, so without this the idle timer would fire while
  // the home view is hidden and the scene would be mid-spin on return.
  useAutoRotateHint({ controlsRef, enabled: active });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault={active}
      enabled={active}
      enableDamping
      dampingFactor={0.05}
      // Ambient idle rotation — see AUTO_ROTATE_SPEED and the idle-timer
      // effects above, which flip controls.autoRotate on/off imperatively
      // via controlsRef (not through this prop, past mount) rather than
      // through React state, so toggling it never re-renders this component
      // or its subtree. Initial value only.
      autoRotate={false}
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      target={HOME_CAMERA.target}
      // Pan is on for every device, clamped to panBoundary (the plot line —
      // wider on mobile/tablet, see panBoundary above) by clampPanTarget
      // above, once per rendered frame — so pan can range freely inside the
      // property but never past it. One finger orbits; two-finger drag pans (the pan half of
      // the TWO: DOLLY_PAN touch mapping below, inert until enablePan is on)
      // while pinch still dollies — mirrors the desktop split of
      // left-drag-to-rotate / right-drag-to-pan.
      enablePan
      // Initial value only — the useFrame above overwrites this every frame
      // once `framing` resolves, counter-scaling it by current zoom distance.
      panSpeed={BASE_PAN_SPEED}
      enableZoom
      // Explicit rather than relying on three.js's default: one finger orbits,
      // two fingers dolly-and-pan simultaneously (pinch to zoom, two-finger
      // drag to pan — active now that enablePan is on above). Paired with the
      // touch-action: none set above so this gesture never fights the page's
      // own touch-scroll.
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      minDistance={zoomLimits.minDistance}
      maxDistance={zoomLimits.maxDistance}
      minPolarAngle={THREE.MathUtils.degToRad(HOME_CAMERA.minPolarDeg)}
      maxPolarAngle={THREE.MathUtils.degToRad(HOME_CAMERA.maxPolarDeg)}
    />
  );
};

// Memoized: controlsRef is a stable ref from useHome, so this bails out of
// re-rendering on every HomeContainer re-render its parents don't cause
// directly (autoRotate itself is set imperatively via controlsRef, not a
// prop, so it never needed a re-render in the first place).
const CameraRig = memo(CameraRigImpl);

export default CameraRig;
