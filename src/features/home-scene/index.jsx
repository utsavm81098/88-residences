import React from "react";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import useHomeScene from "./use-home-scene";
import { getAssetPath } from "@/utils/constant";

export const HomeScene = ({ controlsRef, onCameraChange }) => {
  const { scene, focusCenter } = useHomeScene({
    controlsRef,
    onCameraChange,
  });

  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-19.5, 10.02, 20.1];
  const defaultCameraPosition = [121.96, 42.5, 100.36];

  return (
    <React.Fragment>
      {/* 1. Perspective Camera — narrower FOV for telephoto aerial feel */}
      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.5}
        far={4000}
        position={defaultCameraPosition}
      />

      {/* 2. Interactive Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={orbitTarget}
        enablePan={true}
        enableZoom={true}
        maxDistance={250}
        minDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.05} // Allow looking horizontally to see building facades & horizon
        minPolarAngle={0.1} // Allow looking from above
        autoRotate={false}
        autoRotateSpeed={0.3} // Slow, elegant rotation (if enabled)
      />

      {/* 3. Environment Map (sky-40m.hdr) for metallic reflections */}
      <Environment
        files={getAssetPath("/hdr/sky-40m.hdr")}
        background={false} // Use GLB's baked sky panorama dome
        environmentIntensity={0.8}
        resolution={2048}
      />

      {/* 4. Lights: Base lighting setup to supplement reflections */}
      <ambientLight intensity={0.6} />

      {/* Camera-aligned/directional sun light */}
      <directionalLight
        position={[
          focusCenter[0] + 80,
          focusCenter[1] + 120,
          focusCenter[2] + 80,
        ]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* 5. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </React.Fragment>
  );
};

export default HomeScene;
