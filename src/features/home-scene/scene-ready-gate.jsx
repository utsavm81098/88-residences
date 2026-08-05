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
 * The home scene uses a PMREM environment for subtle facade reflections. This
 * gate warms those materials and the fixed lights before reveal.
 */
const SceneReadyGate = ({ onReady }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !gl || !scene || !camera) return;

    let cancelled = false;
    const started = performance.now();

    const finish = () => {
      if (cancelled || done.current) return;
      done.current = true;
      logger.info(
        `[SceneReadyGate] Ready in ${Math.round(performance.now() - started)}ms`,
        { hasEnvironment: true },
      );

      // Nothing in this scene ever moves once loaded — the camera orbits, but
      // the sun, geometry, and everything shadows fall on are all static (see
      // the matrixWorldAutoUpdate = false comment in use-home-scene.js for the
      // same reasoning). Without this, the renderer recomputes the full
      // 2048x2048 shadow map from the light's perspective on EVERY frame
      // regardless of whether the camera is the only thing moving, which is
      // pure waste and the kind of per-frame cost that shows up as stutter
      // while orbiting on weaker mobile GPUs. needsUpdate forces one last
      // correct render before autoUpdate turns off for good.
      gl.shadowMap.needsUpdate = true;
      gl.shadowMap.autoUpdate = false;

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
        logger.error(
          "[SceneReadyGate] compileAsync failed, revealing anyway",
          error,
        );
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
