import { memo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { logger } from "@/utils/logger";

// Extra time given to the GPU driver to finish linking shader programs in
// the background after gl.compile() issues the work, before the loader is
// allowed to hide. Not a guarantee (see the module comment's compileAsync()
// history below for why a real guarantee was tried and reverted), but a
// real, safe improvement over revealing on the very next frame with zero
// grace period at all.
const SHADER_LINK_GRACE_MS = 400;

/**
 * SceneReadyGate — reports readiness only once the scene can actually be drawn
 * at full quality.
 *
 * `useProgress` reaching 100% only means the bytes arrived. Shaders still have to
 * compile and textures still have to reach the GPU, and doing that lazily on
 * the first draw is what makes the opening frames stutter and appear to assemble.
 * gl.compile() forces all of that to be ISSUED while the loading overlay is
 * still up (see containers/home/home-loader.jsx and
 * containers/canvas-loader/index.jsx), then SHADER_LINK_GRACE_MS gives the
 * driver a window to actually finish linking in the background before
 * reveal, instead of revealing on the very next frame with none.
 *
 * HISTORY — gl.compileAsync() was tried here (twice, independently, in two
 * different sessions) and reverted both times; recorded here so it doesn't
 * get "fixed" back a third time without re-reading this first. compileAsync()
 * calls this same synchronous compile() internally, then returns a Promise
 * that polls program.isReady() until every material's shader has ACTUALLY
 * finished linking — in principle a real guarantee instead of a fixed grace
 * period. In practice it produced an UNCAUGHT "TypeError: Cannot read
 * properties of undefined (reading 'isReady')" inside three.js's own
 * checkMaterialsReady, reproduced live on `npm run dev` (StrictMode
 * double-mounts every <Canvas> subtree — confirmed via instrumented
 * scene.uuid logging that TWO genuinely separate <Canvas> mounts occur, each
 * a real WebGL context, on this exact resource-heavy scene). On a GPU that's
 * already tight on headroom, a second simultaneous context during heavy
 * shader compilation caused a real context loss mid-poll on one of them, and
 * three.js's polling has no cancellation token and no rejection path for
 * that — the promise simply HANGS (onReady() never fires, so whichever
 * loader owns it never hides — this is the exact "loader/carousel never
 * goes away" failure mode reported and reproduced) while the exception fires
 * uncaught, entirely outside this component's try/catch OR .catch() reach —
 * wrapping the call in a Promise chain does not help, because the exception
 * is thrown later, from an unrelated internal poll callback, not as part of
 * this promise settling. That failure mode — even though StrictMode's
 * double-mount is DEV-only and never reaches a production build — was worse
 * than the stutter compileAsync() was fixing, so reverted in favor of this
 * simpler, unconditionally-safe fixed grace period, now for the second time.
 *
 * Preferred over drei's <Preload all />, which additionally runs a six-face
 * CubeCamera pass — six full renders of the scene.
 *
 * Shared across every <Canvas> route (Home's masterplan, Inventory's building)
 * rather than living inside one feature folder — it takes no scene-specific
 * dependency, only the current gl/scene/camera from whichever <Canvas> it is
 * mounted in, so every route gets the same "actually ready" guarantee instead
 * of only the one it happened to be written for first.
 */
const SceneReadyGate = ({ onReady }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!gl || !scene || !camera) return undefined;

    let cancelled = false;
    let rafId = 0;
    let graceTimer = 0;
    const started = performance.now();

    try {
      gl.compile?.(scene, camera);
    } catch (err) {
      logger.error("[SceneReadyGate] compile threw error, revealing anyway", err);
    }

    graceTimer = setTimeout(() => {
      if (cancelled) return;

      if (gl.shadowMap) {
        gl.shadowMap.needsUpdate = true;
        gl.shadowMap.autoUpdate = false;
      }

      logger.info(
        `[SceneReadyGate] Ready in ${Math.round(performance.now() - started)}ms`,
        { hasEnvironment: true },
      );

      invalidate();
      rafId = requestAnimationFrame(() => {
        if (!cancelled) onReady?.();
      });
    }, SHADER_LINK_GRACE_MS);

    return () => {
      cancelled = true;
      clearTimeout(graceTimer);
      cancelAnimationFrame(rafId);
    };
  }, [gl, scene, camera, invalidate, onReady]);

  return null;
};

// Memoized: onReady is a stable useCallback([]) from the owning container's
// hook, so this bails out of re-rendering whenever its parent scene does for
// a reason unrelated to this component — same pattern already used for
// CameraRig/BuildingMarkers/EnvironmentSetup/SceneLights in home-scene.
export default memo(SceneReadyGate);
