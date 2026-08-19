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
import { logger } from "@/utils/logger";

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
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  // Verified this is NOT set automatically: the canvas's computed touch-action
  // is "auto" by default, so a one-finger drag meant to orbit the camera would
  // also trigger the browser's native touch-scroll/pull-to-refresh at the same
  // time. Set explicitly rather than assumed.
  useEffect(() => {
    const el = gl?.domElement;
    if (el) {
      el.style.touchAction = "none";
    }
    return () => {
      if (el) {
        el.style.touchAction = "";
      }
    };
  }, [gl]);

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
      controls.minDistance = zoomLimits.minDistance;
      controls.maxDistance = zoomLimits.maxDistance;
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
  }, [framing, zoomLimits, camera, aspect, controlsRef]);

  // Keep the camera's own aspect in sync if R3F ever lags a resize.
  useEffect(() => {
    if (!camera || !aspect) return;
    if (camera.aspect !== aspect) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect]);

  // Clamps controls.target in place to HOME_PAN_BOUNDARY and, if it moved,
  // shifts camera.position by the same correction vector so the camera-target
  // offset (distance/angles) is preserved exactly. useCallback keeps this
  // referentially stable across renders.
  //
  // controls.update() runs FIRST, unconditionally — not only when a
  // correction is needed. OrbitControls queues each pointermove's pan delta
  // internally and only commits it into `target` the next time update() runs;
  // reading target without flushing first would see stale, pre-event state.
  //
  // ROOT CAUSE OF ASYMMETRIC CLAMPING (fixed here):
  // With enableDamping=true, OrbitControls stores pan input in `_panOffset`
  // and each update() call adds only `_panOffset * dampingFactor` to the
  // target, then multiplies _panOffset by (1 - dampingFactor) — decaying it
  // geometrically across ~20+ frames. This means even after we correct
  // camera.position and set target back to the boundary, the residual
  // _panOffset keeps leaking pan delta into target on every subsequent
  // update() call, pushing it back past the boundary. Whichever axis had
  // more accumulated _panOffset on that particular drag direction could fight
  // its way through the clamp — making restriction appear to work in one
  // direction but not the other.
  //
  // Fix: zero controls._panOffset immediately after any boundary correction.
  // This kills the damping tail at the wall so no residual delta remains to
  // re-apply. The orbit and zoom damping (_sphericalDelta) are left intact so
  // rotation/zoom still feel smooth.
  // Clamps controls.target in place to HOME_PAN_BOUNDARY and, if it moved,
  // shifts camera.position by the same correction vector so the camera-target
  // offset (distance/angles) is preserved exactly.
  //
  // NOTE: controls.update() is NOT called here. Drei's <OrbitControls> already runs
  // controls.update() once per frame in its own useFrame. Calling update() here
  // applied OrbitControls' internal damping decay multiple times per frame,
  // causing jerky stepping and micro-stuttering during camera rotation and panning.
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

      // Zero the internal pan accumulator so damping decay cannot re-apply
      // the residual delta past the boundary on following frames.
      if (controls._panOffset) {
        controls._panOffset.set(0, 0, 0);
      }
    }
  }, [controlsRef, panBoundary]);

  // Per-frame boundary clamp — runs after OrbitControls updates target position
  // to ensure target remains strictly within the plot bounds without stutter.
  useFrame(() => {
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
      makeDefault
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
