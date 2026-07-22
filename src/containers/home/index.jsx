import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import useHome from "./use-home";
import HomeScene from "@/features/home-scene";
import CanvasLoader from "@/containers/canvas-loader";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { HOME_GL_CONFIG } from "@/utils/constant";

export const HomeContainer = () => {
  const controlsRef = useRef();
  const { handleResetCache } = useHome();

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
      {/* Three.js Viewport */}
      <div className="w-full h-full flex justify-center items-center" dir="ltr">
        <ComponentErrorBoundary
          name="Home 3D Canvas"
          onReset={handleResetCache}
        >
          <Canvas
            dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
            performance={{ min: 0.5, debounce: 200 }}
            gl={HOME_GL_CONFIG}
          >
            <Suspense fallback={<CanvasLoader />}>
              <HomeScene controlsRef={controlsRef} />
            </Suspense>
          </Canvas>
        </ComponentErrorBoundary>
      </div>
    </div>
  );
};

export default HomeContainer;

