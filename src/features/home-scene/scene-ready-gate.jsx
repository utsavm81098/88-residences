import { useEffect, useRef } from "react";
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
 * IMPORTANT: This component MUST render AFTER EnvironmentSetup in the JSX tree
 * so that scene.environment is set before shaders are compiled. Otherwise the
 * compiled programs would not include the envMap sampling code and IBL
 * reflections would be invisible until a per-material needsUpdate cycle.
 */
const SceneReadyGate = ({ onReady }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !gl || !scene || !camera) return;

    // Wait for the environment map to be set before compiling shaders.
    // EnvironmentSetup's useEffect runs before ours (same React commit,
    // earlier in the sibling order), so scene.environment should already be
    // set at this point. If it is not, the compiled programs will lack the
    // envMap branch and IBL will not work until a material.needsUpdate cycle
    // (which EnvironmentSetup now forces as a safety net).
    if (!scene.environment) {
      logger.warn(
        "[SceneReadyGate] scene.environment is not set yet — " +
          "compiling without IBL. EnvironmentSetup will force a recompile.",
      );
    }

    let cancelled = false;
    const started = performance.now();

    const finish = () => {
      if (cancelled || done.current) return;
      done.current = true;
      logger.info(
        `[SceneReadyGate] Ready in ${Math.round(performance.now() - started)}ms`,
        { hasEnvironment: !!scene.environment },
      );
      // One more frame after compilation so what we reveal is a complete image.
      invalidate();
      requestAnimationFrame(() => {
        if (!cancelled) onReady?.();
      });
    };

    const compile = gl.compileAsync?.(scene, camera);

    if (compile?.then) {
      compile.then(finish).catch((error) => {
        // Never trap the user behind the loader if warm-up fails.
        logger.error("[SceneReadyGate] compileAsync failed, revealing anyway", error);
        finish();
      });
    } else {
      // three < 0.167 has no compileAsync; the synchronous path still warms up.
      gl.compile?.(scene, camera);
      finish();
    }

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, invalidate, onReady]);

  return null;
};

export default SceneReadyGate;
