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
    recordedPolar,
    handleCameraChange,
    handleResetCamera,
    handleResetCache,
  } = useHome(controlsRef);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-background">
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
            camera={{
              // Camera inside the Sky Dome, elevated angle looking down at all 7 buildings
              // Dome center: ~[-3.5, 27.25, 2.35], effective radius: ~413 units
              // Buildings clustered around: [-4.6, 12, -20.4]
              position: [-74.83, 28.62, -89.50],
              fov: 80,
              near: 0.5,
              far: 4000,
            }}
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

      {/* 4. Camera Data Overlay */}
      {import.meta.env.VITE_CAMERA && cameraData && (
        <div className="absolute bottom-4 right-4 z-10 p-4 bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg text-xs font-mono select-text flex flex-col gap-1 min-w-[280px] pointer-events-auto">
          <div className="text-sm font-bold mb-2 pb-2 border-b">
            Camera Info
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">
              Position
            </span>
            <span>[{cameraData.position.join(", ")}]</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">Target</span>
            <span>[{cameraData.target.join(", ")}]</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">FOV</span>
            <span>{cameraData.fov}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">Near</span>
            <span>{cameraData.near}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">Far</span>
            <span>{cameraData.far}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">
              Polar Angle
            </span>
            <span>{cameraData.polarAngle}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">
              Reached Min Polar
            </span>
            <span>{recordedPolar.min === 1000 ? "N/A" : recordedPolar.min.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-muted-foreground">
              Reached Max Polar
            </span>
            <span>{recordedPolar.max === -1000 ? "N/A" : recordedPolar.max.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeContainer;
