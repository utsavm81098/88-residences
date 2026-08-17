import { memo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { logger } from "@/utils/logger";

/**
 * SceneReadyGate — reports readiness only once the scene can actually be drawn
 * at full quality.
 *
 * `useProgress` reaching 100% only means the bytes arrived. Shaders still have to
 * compile and 321 textures still have to reach the GPU, and doing that lazily on
 * the first draw is what makes the opening frames stutter and appear to assemble.
 * gl.compileAsync() forces all of it while the loading overlay is still up.
 *
 * Preferred over drei's <Preload all />, which additionally runs a six-face
 * CubeCamera pass — six full renders of a million-triangle scene.
 *
 * The home scene uses a PMREM environment for subtle facade reflections. This
 * gate warms those materials and the fixed lights before reveal.
 */
const SceneReadyGate = ({ onReady }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!gl || !scene || !camera) return;

    let cancelled = false;
    const started = performance.now();

    try {
      gl.compile?.(scene, camera);
    } catch (err) {
      logger.error("[SceneReadyGate] compile threw error, revealing anyway", err);
    }

    if (gl.shadowMap) {
      gl.shadowMap.needsUpdate = true;
      gl.shadowMap.autoUpdate = false;
    }

    logger.info(
      `[SceneReadyGate] Ready in ${Math.round(performance.now() - started)}ms`,
      { hasEnvironment: true },
    );

    invalidate();
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) {
        onReady?.();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [gl, scene, camera, invalidate, onReady]);

  return null;
};

// Memoized: onReady is a stable useCallback([]) from useHome, so this bails
// out of re-rendering whenever HomeSceneImpl does for a reason unrelated to
// this component — same pattern already used for
// HomeScene/CameraRig/BuildingMarkers/EnvironmentSetup/SceneLights.
export default memo(SceneReadyGate);
