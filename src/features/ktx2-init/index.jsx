import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { initKTX2 } from "@/utils/preloader";

/**
 * KTX2Loader needs a live renderer to know which compressed formats the GPU
 * supports. Rendered outside <Suspense> so it runs before the GLB is requested.
 *
 * useLayoutEffect, not a render-phase call: calling initKTX2 directly in the
 * component body was a side effect during render (harmless in practice since
 * it's idempotent, but against the rules of pure render). useLayoutEffect
 * still fires before any *passive* useEffect in the same commit — including
 * useHomeScene's effect that kicks off the GLB fetch — so KTX2 support
 * detection is still guaranteed to complete before anything tries to
 * transcode a KHR_texture_basisu texture.
 *
 * Lives in features/ rather than inside the home container because BOTH
 * canvases mount it: initKTX2 is what resolves whenKTX2Ready(), and the idle
 * cross-route preload in src/main.jsx awaits that promise before parsing a GLB
 * outside any Canvas. Without this on the inventory route, landing on
 * /inventory would leave KTX2 support undetected and the home GLB preload
 * would never run.
 */
export const KTX2Init = () => {
  const gl = useThree((state) => state.gl);

  useLayoutEffect(() => {
    initKTX2(gl);
  }, [gl]);

  return null;
};

export default KTX2Init;
