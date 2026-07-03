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

  // Default camera positionOffset: place the camera to see the building box from the front/side
  // We offset by 150 units in X and Z, and 60 units in Y relative to the box center
  const defaultCameraPosition = [
    focusCenter[0] + 150,
    focusCenter[1] + 60,
    focusCenter[2] + 150,
  ];

  return (
    <React.Fragment>
      {/* 1. Perspective Camera focused near the box's elevation */}
      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.5}
        far={4000}
        position={defaultCameraPosition}
      />

      {/* 2. Interactive Orbit Controls focused on the box's center */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={focusCenter}
        enablePan={true}
        enableZoom={true}
        maxDistance={250}
        minDistance={120}
        maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below the ground plane/surface level
      />

      {/* 3. Environment Map (sky-40m.hdr) for metallic reflections */}
      <Environment
        files={getAssetPath("/hdr/sky-40m.hdr")}
        background={false} // Use GLB's baked sky panorama dome
        environmentIntensity={1.5}
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
