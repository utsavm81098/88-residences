import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

// Ambient idle rotation. Three.js's own OrbitControls.autoRotate/autoRotateSpeed
// (node_modules/three-stdlib/controls/OrbitControls.js) already advances the
// azimuth every frame the controls are idle (state === STATE.NONE) — reusing
// it means no extra render loop, timer-driven animation, or dependency is
// needed, just a boolean flipped on and off (see the idle-timer effects
// below for why that flip is paired with an explicit invalidate() call).
export const AUTO_ROTATE_SPEED = 0.2;
// How long the very first idle stretch waits before auto-rotate starts.
// Historically this was HINT_SHOW_DELAY_MS + HINT_ROTATE_DELAY_MS (10s + 10s)
// while a one-time drag hint was shown at the 10s mark before rotation began;
// the hint UI (DragHint) was removed, but the 20s first-idle delay itself is
// still the intended feel, so the value is kept as-is.
const INITIAL_ROTATE_DELAY_MS = 20_000;
// How long to wait after an interaction ends, with no further interaction,
// before auto-rotate resumes.
const RESUME_IDLE_MS = 2 * 60_000;

/**
 * useAutoRotateHint — owns the home camera's idle auto-rotate. Extracted out
 * of CameraRig so that component stays focused on framing/pan/zoom; this
 * hook is the single place that knows about the rotate timing sequence.
 *
 * Talks to the OrbitControls instance imperatively via `controlsRef` (same
 * pattern CameraRig already uses for panSpeed/target — see that file).
 * Renders nothing and returns nothing — it is pure side-effect, call it once
 * from CameraRig's body.
 *
 * Memory-leak audit (verified by inspection, not assumed): the `setTimeout`
 * this hook arms is tracked in `idleTimerRef`, and the mount effect's
 * cleanup unconditionally clears it — since the ref always reads the CURRENT
 * pending timer id (not a stale one captured at effect-setup time), this
 * correctly cancels whichever timer is outstanding at unmount, whether it
 * was armed by the initial mount or by a later handleEnd resume. Both
 * `controls.addEventListener` calls are paired with a matching
 * `removeEventListener` in the same effect's cleanup. React 18 StrictMode
 * (enabled in this app, see src/main.jsx) double-invokes effects in
 * development specifically to catch missing cleanup like this — verified
 * live that mounting/unmounting repeatedly does not accumulate timers or
 * listeners.
 */
export const useAutoRotateHint = ({ controlsRef }) => {
  const invalidate = useThree((state) => state.invalidate);

  const idleTimerRef = useRef(null);

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

  // First arm: CameraRig only mounts once the GLB has loaded
  // (src/features/home-scene/index.jsx), so "on mount" already means "after
  // the model is ready" — no separate onReady/SceneReadyGate gating needed.
  useEffect(() => {
    scheduleIdleTimer(INITIAL_ROTATE_DELAY_MS);

    const controls = controlsRef.current;
    return () => {
      clearTimeout(idleTimerRef.current);
      if (controls) controls.autoRotate = false;
    };
  }, [scheduleIdleTimer, controlsRef]);

  // 'start'/'end' are three.js EventDispatcher events (not DOM events),
  // dispatched by OrbitControls itself around every orbit drag, pan drag,
  // and wheel/pinch zoom (see onMouseDown/onMouseWheel/onTouchStart/
  // onPointerUp in node_modules/three-stdlib/controls/OrbitControls.js).
  // 'start' stops rotation immediately, even mid-rotation; 'end' re-arms the
  // (longer) resume timer for the next idle stretch.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      clearTimeout(idleTimerRef.current);
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
  }, [controlsRef, scheduleIdleTimer]);
};

export default useAutoRotateHint;
