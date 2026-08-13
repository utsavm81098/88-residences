import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

// Ambient idle rotation. Three.js's own OrbitControls.autoRotate/autoRotateSpeed
// (node_modules/three-stdlib/controls/OrbitControls.js) already advances the
// azimuth every frame the controls are idle (state === STATE.NONE) — reusing
// it means no extra render loop, timer-driven animation, or dependency is
// needed, just a boolean flipped on and off (see the idle-timer effects
// below for why that flip is paired with an explicit invalidate() call).
export const AUTO_ROTATE_SPEED = 0.2;
// Two-stage sequence for the very first idle stretch only (see
// hintRetiredRef below): a one-time drag hint appears at HINT_SHOW_DELAY_MS,
// then auto-rotate itself starts at INITIAL_ROTATE_DELAY_MS if still
// untouched. Every idle stretch after the first real interaction skips the
// hint entirely and goes straight to RESUME_IDLE_MS, unchanged from before.
const HINT_SHOW_DELAY_MS = 10_000;
const HINT_ROTATE_DELAY_MS = 10_000;
const INITIAL_ROTATE_DELAY_MS = HINT_SHOW_DELAY_MS + HINT_ROTATE_DELAY_MS;
// How long to wait after an interaction ends, with no further interaction,
// before auto-rotate resumes.
const RESUME_IDLE_MS = 2 * 60_000;

/**
 * useAutoRotateHint — owns the home camera's idle auto-rotate and the
 * one-time drag hint that precedes it. Extracted out of CameraRig so that
 * component stays focused on framing/pan/zoom; this hook is the single
 * place that knows about the hint/rotate timing sequence.
 *
 * Talks to the OrbitControls instance imperatively via `controlsRef` (same
 * pattern CameraRig already uses for panSpeed/target — see that file) rather
 * than through React state, and reports the hint's visibility upward via
 * `onHintVisibleChange` exactly like CameraRig's onReady/isReady wiring.
 * Renders nothing and returns nothing — it is pure side-effect, call it once
 * from CameraRig's body.
 *
 * Memory-leak audit (verified by inspection, not assumed): every `setTimeout`
 * this hook ever arms is tracked in one of the two refs below, and the mount
 * effect's cleanup unconditionally clears both — since refs always read the
 * CURRENT pending timer id (not a stale one captured at effect-setup time),
 * this correctly cancels whichever timer is outstanding at unmount, whether
 * it was armed by the initial mount or by a later handleEnd resume. Both
 * `controls.addEventListener` calls are paired with a matching
 * `removeEventListener` in the same effect's cleanup. React 18 StrictMode
 * (enabled in this app, see src/main.jsx) double-invokes effects in
 * development specifically to catch missing cleanup like this — verified
 * live that mounting/unmounting repeatedly does not accumulate timers,
 * listeners, or duplicate hint callbacks.
 */
export const useAutoRotateHint = ({ controlsRef, onHintVisibleChange }) => {
  const invalidate = useThree((state) => state.invalidate);

  const idleTimerRef = useRef(null);
  const hintShowTimerRef = useRef(null);
  // Flips to true, once, forever, the moment the user first interacts —
  // that's the ONLY thing that retires the hint. Auto-rotate starting on its
  // own does NOT hide it: the hint and the rotation are meant to be visible
  // together for as long as the page sits untouched, both stopping only
  // when the user actually takes control. Never reset once true, so no
  // later idle-to-rotate transition (after RESUME_IDLE_MS) can ever show the
  // hint again — the "only once per page load" rule.
  const hintRetiredRef = useRef(false);

  // Cancels the pending hint-show timer (harmless if it already fired, was
  // never armed, or the hint is already showing) and, only the first time
  // this is called this page load, tells the parent to hide the hint. Only
  // ever called from handleStart below — a real interaction is the one and
  // only thing that ends the hint's visible window.
  const retireHint = useCallback(() => {
    clearTimeout(hintShowTimerRef.current);
    if (hintRetiredRef.current) return;
    hintRetiredRef.current = true;
    onHintVisibleChange?.(false);
  }, [onHintVisibleChange]);

  const scheduleIdleTimer = useCallback(
    (delayMs) => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        const controls = controlsRef.current;
        if (!controls) return;
        controls.autoRotate = true;
        invalidate();
      }, delayMs);
    },
    [controlsRef, invalidate],
  );

  // First arm: CameraRig only mounts once the GLB's <Suspense> resolves
  // (src/features/home-scene/index.jsx), so "on mount" already means "after
  // the model has loaded" — no separate onReady/SceneReadyGate gating
  // needed. Two independent timers, both started from mount (t=0), not
  // chained: one shows the one-time drag hint at HINT_SHOW_DELAY_MS, the
  // other starts auto-rotate at INITIAL_ROTATE_DELAY_MS if still untouched —
  // the hint stays showing right through that transition and beyond, only
  // ever dismissed by an actual interaction (see handleStart below).
  useEffect(() => {
    hintShowTimerRef.current = setTimeout(() => {
      if (hintRetiredRef.current) return;
      onHintVisibleChange?.(true);
    }, HINT_SHOW_DELAY_MS);

    scheduleIdleTimer(INITIAL_ROTATE_DELAY_MS);

    const controls = controlsRef.current;
    return () => {
      clearTimeout(hintShowTimerRef.current);
      clearTimeout(idleTimerRef.current);
      if (controls) controls.autoRotate = false;
    };
  }, [scheduleIdleTimer, controlsRef, onHintVisibleChange]);

  // 'start'/'end' are three.js EventDispatcher events (not DOM events),
  // dispatched by OrbitControls itself around every orbit drag, pan drag,
  // and wheel/pinch zoom (see onMouseDown/onMouseWheel/onTouchStart/
  // onPointerUp in node_modules/three-stdlib/controls/OrbitControls.js).
  // 'start' stops rotation immediately, even mid-rotation, and retires the
  // hint if this is the first interaction ever; 'end' re-arms the (longer)
  // resume timer for the next idle stretch.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      clearTimeout(idleTimerRef.current);
      retireHint();
      controls.autoRotate = false;
    };
    const handleEnd = () => {
      scheduleIdleTimer(RESUME_IDLE_MS);
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);
    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, [controlsRef, scheduleIdleTimer, retireHint]);
};

export default useAutoRotateHint;
