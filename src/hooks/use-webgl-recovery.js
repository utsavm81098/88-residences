import { useEffect, useRef, useCallback, useState } from "react";
import { useThree } from "@react-three/fiber";
import { logger } from "@/utils/logger";

/**
 * Listens for WebGL context loss/restore events on the Canvas renderer.
 * Acts as a safety net: when the GPU runs out of memory, the browser fires
 * `webglcontextlost` before killing the tab. By calling `preventDefault()`
 * we give the browser a chance to recover instead of crashing.
 *
 * @param {Object} options
 * @param {Function} [options.onContextLost] - Called when WebGL context is lost.
 * @param {Function} [options.onContextRestored] - Called when context is restored.
 * @returns {{ isContextLost: boolean }}
 */
const useWebGLRecovery = ({ onContextLost, onContextRestored } = {}) => {
  const gl = useThree((state) => state.gl);
  const [isContextLost, setIsContextLost] = useState(false);
  const onContextLostRef = useRef(onContextLost);
  const onContextRestoredRef = useRef(onContextRestored);

  // Keep refs fresh without re-subscribing to events
  onContextLostRef.current = onContextLost;
  onContextRestoredRef.current = onContextRestored;

  const handleContextLost = useCallback((event) => {
    // Prevent the browser from killing the tab — this is the critical line
    event.preventDefault();
    logger.error("WebGL context lost — GPU memory may be exhausted", {
      level: "critical",
    });
    setIsContextLost(true);
    onContextLostRef.current?.();
  }, []);

  const handleContextRestored = useCallback(() => {
    logger.info("WebGL context restored — recovering");
    setIsContextLost(false);
    onContextRestoredRef.current?.();
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [gl, handleContextLost, handleContextRestored]);

  return { isContextLost };
};

export default useWebGLRecovery;
