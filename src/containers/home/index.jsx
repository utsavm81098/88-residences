import React, { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import useHome from "./use-home";
import HomeScene from "@/features/home-scene";
import CanvasLoader from "@/containers/canvas-loader";
import { ComponentErrorBoundary } from "@/components/error-boundary";
import { HOME_GL_CONFIG } from "@/utils/constant";

export const HomeContainer = () => {
  const controlsRef = useRef();
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const { cameraData, handleCameraChange, handleResetCache } =
    useHome(controlsRef);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
      {/* 2. Development Mode Coordinates HUD Overlay */}
      {import.meta.env.DEV && cameraData && (
        <div className="absolute bottom-6 right-6 z-20 p-4 bg-black/90 border border-white/10 rounded-lg text-white font-mono text-[11px] w-[280px] pointer-events-auto select-all">
          <h4 className="text-accent-yellow font-bold uppercase tracking-widest text-[9px] mb-3">
            🎯 Dev Camera Coordinates
          </h4>
          <div className="mb-2">
            <span className="text-green-400 font-bold">
              🟢 Camera Position:
            </span>
            <div className="bg-white/5 rounded px-2 py-1 mt-1">
              [{cameraData.position.join(", ")}]
            </div>
          </div>
          <div className="mb-3">
            <span className="text-red-400 font-bold">🔴 Orbit Target:</span>
            <div className="bg-white/5 rounded px-2 py-1 mt-1">
              [{cameraData.target.join(", ")}]
            </div>
          </div>

          <div className="mb-3 pt-2 border-t border-white/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoRotate}
                onChange={(e) => setIsAutoRotate(e.target.checked)}
                className="w-3 h-3 accent-accent-yellow cursor-pointer"
              />
              <span className="text-white/80 font-sans tracking-wide">
                Auto-Rotate Camera
              </span>
            </label>
          </div>
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
            gl={HOME_GL_CONFIG}
            shadows
          >
            <Suspense fallback={<CanvasLoader />}>
              <HomeScene
                {...{
                  controlsRef,
                  isAutoRotate,
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
