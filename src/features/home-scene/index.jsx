import React, { Fragment } from "react";
import * as THREE from "three";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import useHomeScene from "./use-home-scene";
import { getAssetPath } from "@/utils/constant";
import DevMarkers from "./dev-markers";

export const HomeScene = ({ controlsRef, isAutoRotate, onCameraChange }) => {
  const { scene } = useHomeScene();

  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-9.49, 19.47, -21.04];
  const defaultCameraPosition = [-173.97, 48.34, -97.77];

  return (
    <Fragment>
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
        enablePan={false}
        enableZoom={true}
        autoRotate={isAutoRotate}
        autoRotateSpeed={2}
        minDistance={120}
        maxDistance={210}
        minPolarAngle={THREE.MathUtils.degToRad(5)}
        maxPolarAngle={Math.PI / 2 - THREE.MathUtils.degToRad(10)} // 10 degrees above the ground plane
      />

      {/* 3. Environment Map (IBL) — 80m-nano-green, matching GLTF Editor exactly */}
      {/*    Pure IBL only — no additional scene lights */}
      <Environment
        files={getAssetPath("/hdr/80m-nano-green.jpg")}
        background={true}
        backgroundBlurriness={0}
        environmentIntensity={1.0}
        environmentRotation={[0, Math.PI / 2, 0]}
        resolution={2048}
      />

      {/* 5. DEV-only: Draggable target (red) + camera position (green) markers */}
      {import.meta.env.DEV && (
        <DevMarkers controlsRef={controlsRef} onCameraChange={onCameraChange} />
      )}

      {/* 6. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </Fragment>
  );
};

export default HomeScene;
