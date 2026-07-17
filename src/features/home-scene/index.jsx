import React, { Fragment } from "react";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import useHomeScene from "./use-home-scene";
import EnvironmentSetup from "./environment-setup";
import DevMarkers from "./dev-markers";

export const HomeScene = ({ controlsRef, isAutoRotate, onCameraChange }) => {
  const { scene } = useHomeScene();

  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-5.0, 20, -7.0];
  const defaultCameraPosition = [-173, 53, -88];

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
        maxPolarAngle={Math.PI / 2 - THREE.MathUtils.degToRad(10)}
      />

      {/* 3. Environment Map (IBL) — manual TextureLoader + PMREM pipeline     */}
      {/*    Bypasses Drei's HDRJPGLoader which corrupts standard JPEG colorSpace */}
      <EnvironmentSetup environmentRotation={[0, Math.PI / 2, 0]} />

      {/* 4. DEV-only: Draggable target (red) + camera position (green) markers */}
      {import.meta.env.DEV && (
        <DevMarkers controlsRef={controlsRef} onCameraChange={onCameraChange} />
      )}

      {/* 5. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </Fragment>
  );
};

export default HomeScene;
