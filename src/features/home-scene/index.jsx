import React, { useEffect } from "react";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import useHomeScene from "./use-home-scene";

/**
 * CameraAttachedLights — Punctual lights parented to the camera.
 *
 * Matches the gltf-viewer (donmccurdy) lighting setup:
 * - AmbientLight at intensity 0.3
 * - DirectionalLight at intensity 0.8 * Math.PI (~2.51), positioned at
 *   60° from camera forward axis (0.5, 0, 0.866)
 *
 * Camera-attached lights move with the camera, producing even illumination
 * from every viewing angle — unlike world-fixed directional lights which
 * create hot spots and visible directional shadows.
 */
const CameraAttachedLights = () => {
  const { camera, scene } = useThree();

  useEffect(() => {
    // Ambient: soft fill (gltf-viewer default = 0.3)
    const ambient = new THREE.AmbientLight("#FFFFFF", 0.3);
    ambient.name = "home_ambient_light";
    camera.add(ambient);

    // Directional: camera-attached at ~60° from camera forward
    // (gltf-viewer default = 0.8 * Math.PI)
    const directional = new THREE.DirectionalLight(
      "#FFFFFF",
      0.8 * Math.PI
    );
    directional.position.set(0.5, 0, 0.866);
    directional.name = "home_main_light";
    camera.add(directional);

    // Camera must be in the scene graph for its children to render
    scene.add(camera);

    return () => {
      camera.remove(ambient);
      camera.remove(directional);
      ambient.dispose();
      directional.dispose();
    };
  }, [camera, scene]);

  return null;
};

export const HomeScene = ({ controlsRef, onCameraChange }) => {
  const { scene } = useHomeScene({
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
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={0.1}
        autoRotate={false}
        autoRotateSpeed={0.3}
      />

      {/* 3. Neutral Environment — matches gltf-viewer's RoomEnvironment */}
      <Environment preset="apartment" background={false} />

      {/* 4. Camera-attached punctual lights (gltf-viewer pattern) */}
      <CameraAttachedLights />

      {/* 5. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </React.Fragment>
  );
};

export default HomeScene;
