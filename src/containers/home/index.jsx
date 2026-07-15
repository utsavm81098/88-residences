import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import useHome from "./use-home";
import HomeScene from "@/features/home-scene";
import CanvasLoader from "@/containers/canvas-loader";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { CANVAS_GL_CONFIG } from "@/utils/constant";

export const HomeContainer = () => {
  const controlsRef = useRef();
  const {
    cameraData,
    handleCameraChange,
    handleResetCamera,
    handleResetCache,
  } = useHome(controlsRef);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
      {/* 1. Reset Camera button in top corner for utility */}
      {/* <div className="absolute top-6 right-6 z-20 flex gap-3">
        <Button
          onClick={handleResetCamera}
          variant="outline"
          className="bg-black/50 border-white/10 text-white hover:bg-white/10 hover:text-white"
        >
          Reset Camera
        </Button>
      </div> */}

      {/* 2. Development Mode Coordinates HUD Overlay */}
      {import.meta.env.DEV && cameraData && (
        <div className="absolute bottom-6 right-6 z-20 p-4 bg-black/80 border border-white/10 rounded-lg text-white font-mono text-[11px] max-w-[340px] pointer-events-auto">
          <h4 className="text-accent-yellow font-bold uppercase tracking-widest text-[9px] mb-2">
            Dev Camera Coordinates
          </h4>
          <div className="mb-1">
            <span className="text-white/50">Position:</span> [
            {cameraData.position.join(", ")}]
          </div>
          <div className="mb-2">
            <span className="text-white/50">Target:</span> [
            {cameraData.target.join(", ")}]
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Drag the view to rotate, then hardcode these values in{" "}
            <code className="text-white/70">use-home-scene.js</code> if you want
            to lock the landing view.
          </p>
        </div>
      )}

      {/* 3. Three.js Viewport */}
      <div className="w-full h-full flex justify-center items-center" dir="ltr">
        <ComponentErrorBoundary
          name="Home 3D Canvas"
          onReset={handleResetCache}
        >
          <Canvas
            dpr={[1.5, Math.min(window.devicePixelRatio, 2)]}
            performance={{ min: 0.5, debounce: 200 }}
            gl={CANVAS_GL_CONFIG}
            shadows
          >
            <Suspense fallback={<CanvasLoader />}>
              <HomeScene
                {...{
                  controlsRef,
                  onCameraChange: handleCameraChange,
                }}
              />
            </Suspense>
          </Canvas>
        </ComponentErrorBoundary>
      </div>
    </div>
  );
};

export default HomeContainer;
