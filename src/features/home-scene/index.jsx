import React, { Fragment } from "react";
import { OrbitControls } from "@react-three/drei";
import useHomeScene from "./use-home-scene";

export const HomeScene = ({ controlsRef, onCameraChange }) => {
  const { scene } = useHomeScene();

  // Orbit target centered on the building cluster
  const orbitTarget = [0.99, 10.03, -30.91];

  const handleControlsChange = (e) => {
    if (onCameraChange && e.target) {
      const controls = e.target;
      const camera = controls.object;
      onCameraChange({
        position: [
          camera.position.x.toFixed(2),
          camera.position.y.toFixed(2),
          camera.position.z.toFixed(2),
        ],
        target: [
          controls.target.x.toFixed(2),
          controls.target.y.toFixed(2),
          controls.target.z.toFixed(2),
        ],
        fov: camera.fov ? camera.fov.toFixed(2) : "N/A",
        near: camera.near ? camera.near.toFixed(2) : "N/A",
        far: camera.far ? camera.far.toFixed(2) : "N/A",
        polarAngle: controls.getPolarAngle().toFixed(2),
        minPolarAngle: controls.minPolarAngle.toFixed(2),
        maxPolarAngle: controls.maxPolarAngle.toFixed(2),
      });
    }
  };

  return (
    <Fragment>
      {/* 2. Interactive Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.04}      // Lowered slightly for smoother easing/glide
        zoomSpeed={0.6}           // Reduced zoom speed for less abrupt scrolling jumps
        target={orbitTarget}
        enablePan={true}
        enableZoom={true}
        minPolarAngle={0.5}       // ~29° from top — allows elevated bird's-eye views
        maxPolarAngle={Math.PI / 2 - (10 * Math.PI / 180)} // 80° — 10° above horizon
        maxDistance={135}           // Increased to allow framing all buildings from any angle when rotated
        minDistance={50}            // Prevent getting too close to buildings
        autoRotate={false}
        autoRotateSpeed={0.3}
        onChange={handleControlsChange}
      />

      {/* 5. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </Fragment>
  );
};

export default HomeScene;
