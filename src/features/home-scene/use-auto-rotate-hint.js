import { useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

// Ambient idle rotation. Three.js's own OrbitControls.autoRotate/autoRotateSpeed
// (node_modules/three-stdlib/controls/OrbitControls.js) already advances the
// azimuth every frame the controls are idle (state === STATE.NONE) — reusing
// it means no extra render loop, timer-driven animation, or dependency is
// needed, just a boolean flipped on and off (see the idle-timer effects
// below for why that flip is paired with an explicit invalidate() call).
export const AUTO_ROTATE_SPEED = 0.2;
// The very first idle stretch of the whole page session — before the user
// has ever interacted with the scene even once — waits longer than every
// later idle stretch, but (like every later one) shows the hint and starts
// auto-rotate simultaneously, not staggered.
const FIRST_LOAD_IDLE_DELAY_MS = 10_000;
// Every idle stretch AFTER that first one — every subsequent
// resume-from-interaction, and every return to Home from Inventory (see
// hasArmedFirstIdleCycle below for why a return counts as "after", not as
// another first load) — is fast and simultaneous: no separate lead-in, the
// hint and auto-rotate both appear together at this single mark.
const RESUME_IDLE_DELAY_MS = 60_000;

// Module-scope, not per-hook-instance: CameraRig — and this hook with it —
// fully UNMOUNTS when Home deactivates and REMOUNTS from scratch when Home
// reactivates (see features/home-scene/index.jsx's `{active && <CameraRig
// .../>}`), so a plain ref/state flag here would reset on every Inventory
// round-trip, making every return to Home replay the slow first-load
// sequence instead of the fast one. This flag survives that remount and is
// reset only by an actual page reload. Same singleton justification as
// use-home-scene.js's own tunedTopLevelNodes: this app mounts exactly one
// Home scene per session.
//
// REAL BUG FIXED HERE, confirmed by tracing it: this used to flip to `true`
// SYNCHRONOUSLY inside scheduleIdleCycle, the instant a cycle was armed —
// not when its timer actually fired. React 18 StrictMode (enabled in this
// app, see src/main.jsx) double-invokes effects on every component's first
// real mount specifically to catch bugs like this: setup -> cleanup ->
// setup, all synchronously, before anything the app schedules can possibly
// elapse. The mount effect's FIRST (throwaway, "ghost") setup call armed
// the slow first-load timers and flipped this flag true; its paired
// cleanup then cancelled those timers before they ever fired; the SECOND
// (real, lasting) setup call ran scheduleIdleCycle again and saw the flag
// already true — wrongly taking the fast 60s/60s resume path on what was,
// from the user's perspective, an actual page reload. Fixed by moving the
// flip into the gesture timer's fire callback below (see scheduleIdleCycle):
// a timer that gets cleared before elapsing — as the ghost mount's always
// does, since StrictMode's cleanup runs within the same tick, nowhere near
// FIRST_LOAD_IDLE_DELAY_MS later — can never reach that callback, so only a
// timer that survives to actually fire can consume the first-load slot.
// Same reasoning applies if a real user interacts before the hint ever
// shows: the slot stays unconsumed and the next idle stretch retries the
// slow first-load delay rather than skipping straight to the fast one — the
// onboarding wasn't actually delivered yet, so that's correct, not a
// regression of this fix.
let hasArmedFirstIdleCycle = false;

/**
 * useAutoRotateHint — owns the home camera's idle auto-rotate AND the
 * hand-gesture hint that precedes it. Extracted out of CameraRig so that
 * component stays focused on framing/pan/zoom; this hook is the single
 * place that knows about the rotate/hint timing sequence.
 *
 * Every idle stretch (the very first one ever, every subsequent
 * resume-from-interaction, and every return to Home from Inventory) ends
 * with the hand-gesture hint and auto-rotate both turning on AT THE SAME
 * TIME, then both flip off together the instant the user interacts again —
 * see hasArmedFirstIdleCycle's own comment for why only the FIRST stretch
 * ever uses the slower FIRST_LOAD_IDLE_DELAY_MS while every stretch after
 * that uses the shorter RESUME_IDLE_DELAY_MS. `onHintVisibleChange` is how
 * the hint-visibility flag reaches the DOM overlay that actually renders it
 * (src/components/ui/hand-gesture-hint), since this hook itself renders
 * nothing.
 *
 * Talks to the OrbitControls instance imperatively via `controlsRef` (same
 * pattern CameraRig already uses for panSpeed/target — see that file).
 * Renders nothing and returns nothing — it is pure side-effect, call it once
 * from CameraRig's body.
 *
 * Memory-leak audit (verified by inspection, not assumed): both `setTimeout`s
 * this hook arms are tracked in `gestureTimerRef`/`rotateTimerRef`, and the
 * mount effect's cleanup unconditionally clears both — since the refs always
 * read the CURRENT pending timer id (not a stale one captured at
 * effect-setup time), this correctly cancels whichever timers are
 * outstanding at unmount, whether they were armed by the initial mount or by
 * a later handleEnd resume. Both `controls.addEventListener` calls are
 * paired with a matching `removeEventListener` in the same effect's cleanup.
 * React 18 StrictMode (enabled in this app, see src/main.jsx) double-invokes
 * effects in development specifically to catch missing cleanup like this —
 * verified live that mounting/unmounting repeatedly does not accumulate
 * timers or listeners.
 */
export const useAutoRotateHint = ({
  controlsRef,
  enabled = true,
  onHintVisibleChange,
}) => {
  const invalidate = useThree((state) => state.invalidate);

  const gestureTimerRef = useRef(null);
  const rotateTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(gestureTimerRef.current);
    clearTimeout(rotateTimerRef.current);
  }, []);

  // Arms one full idle stretch — hint and auto-rotate both fire at the same
  // delay, always. The very first call ever (module-lifetime, via
  // hasArmedFirstIdleCycle) uses FIRST_LOAD_IDLE_DELAY_MS; every call after
  // that — same mount's handleEnd, or a fresh mount's own first arm after
  // returning from Inventory — uses the shorter RESUME_IDLE_DELAY_MS.
  const scheduleIdleCycle = useCallback(() => {
    clearTimers();

    const isFirstCycle = !hasArmedFirstIdleCycle;
    const delay = isFirstCycle
      ? FIRST_LOAD_IDLE_DELAY_MS
      : RESUME_IDLE_DELAY_MS;

    gestureTimerRef.current = setTimeout(() => {
      // Consume the first-load slot HERE, on fire, not at schedule time
      // above — see hasArmedFirstIdleCycle's own comment for why that
      // distinction is exactly what makes this resilient to React
      // StrictMode's double-invoked mount effect.
      if (isFirstCycle) hasArmedFirstIdleCycle = true;
      onHintVisibleChange?.(true);
    }, delay);

    rotateTimerRef.current = setTimeout(() => {
      const controls = controlsRef.current;
      if (!controls) return;
      controls.autoRotate = true;
      invalidate();
    }, delay);
  }, [clearTimers, controlsRef, invalidate, onHintVisibleChange]);

  // First arm: CameraRig only mounts once the GLB has loaded
  // (src/features/home-scene/index.jsx), so "on mount" already means "after
  // the model is ready" — no separate onReady/SceneReadyGate gating needed.
  // CameraRig itself unmounts/remounts on every Home <-> Inventory switch
  // (see hasArmedFirstIdleCycle's own comment above), so this effect's mount
  // arm doubles as BOTH the true first-ever arm AND every return-to-Home
  // re-arm — scheduleIdleCycle tells the two apart via that module-scope
  // flag, not via anything here.
  //
  // `enabled` is a defensive belt-and-braces gate against `active` ever
  // going false while this component instance is still mounted (it
  // shouldn't, given the `{active && <CameraRig .../>}` gating one level up
  // — but if it ever did, without this the setTimeouts would keep running
  // in the background and flip the hint/autoRotate on while Home was
  // hidden). Disabling clears both pending timers and forces autoRotate/the
  // hint off.
  useEffect(() => {
    const controls = controlsRef.current;

    if (!enabled) {
      clearTimers();
      if (controls) controls.autoRotate = false;
      onHintVisibleChange?.(false);
      return undefined;
    }

    scheduleIdleCycle();

    return () => {
      clearTimers();
      if (controls) controls.autoRotate = false;
      onHintVisibleChange?.(false);
    };
  }, [enabled, scheduleIdleCycle, clearTimers, controlsRef, onHintVisibleChange]);

  // 'start'/'end' are three.js EventDispatcher events (not DOM events),
  // dispatched by OrbitControls itself around every orbit drag, pan drag,
  // and wheel/pinch zoom (see onMouseDown/onMouseWheel/onTouchStart/
  // onPointerUp in node_modules/three-stdlib/controls/OrbitControls.js).
  // 'start' stops rotation AND hides the hint immediately, even mid-rotation;
  // 'end' re-arms the same idle cycle — hint then rotate again — for the
  // next idle stretch. This repeats for as long as the scene stays active:
  // every interaction end starts a fresh idle cycle.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !enabled) return undefined;

    const handleStart = () => {
      clearTimers();
      controls.autoRotate = false;
      onHintVisibleChange?.(false);
    };
    const handleEnd = () => {
      scheduleIdleCycle();
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);
    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
    };
  }, [enabled, controlsRef, scheduleIdleCycle, clearTimers, onHintVisibleChange]);
};

export default useAutoRotateHint;
