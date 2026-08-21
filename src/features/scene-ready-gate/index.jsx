import { memo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { logger } from "@/utils/logger";

// Extra time given to the GPU driver to finish linking shader programs in
// the background after gl.compile() issues the work, before the loader is
// allowed to hide. Not a guarantee (see the module comment's compileAsync()
// history below for why a real guarantee was tried and reverted), but a
// real, safe improvement over revealing on the very next frame with zero
// grace period at all.
// Extra time given to the GPU driver to finish linking shader programs in
// the background after gl.compile() issues the work, before the loader is
// allowed to hide.
const SHADER_LINK_GRACE_MS = 400;

// Track scenes that have already been compiled so repeat route visits are instant
const compiledScenes = new WeakSet();

const SceneReadyGate = ({ onReady }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!gl || !scene || !camera) return undefined;

    // If scene has already been compiled in this session, reveal immediately
    if (compiledScenes.has(scene)) {
      onReady?.();
      return undefined;
    }

    let cancelled = false;
    let rafId = 0;
    let graceTimer = 0;
    const started = performance.now();

    try {
      gl.compile?.(scene, camera);
      compiledScenes.add(scene);
    } catch (err) {
      logger.error("[SceneReadyGate] compile threw error, revealing anyway", err);
    }

    graceTimer = setTimeout(() => {
      if (cancelled) return;

      if (gl.shadowMap) {
        gl.shadowMap.needsUpdate = true;
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
