import React, { Fragment } from "react";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import useHomeScene from "./use-home-scene";
import EnvironmentSetup from "./environment-setup";

// --- Environment orientation: match the GLTF editor reference ---------------
// The reference render in gltfeditor.com uses "Env rotation: 1°", and matching
// that clean look takes priority over a specific sun azimuth. Rotating the
// environment about Y turns the visible background AND all reflections together.
//
// The sun itself is baked into the HDR sky (public/hdr/80m-nano-green.jpg) — the
// GLB has no lights. Measured off the equirectangular panorama, the baked sun
// sits at ~182° local azimuth and ~39° elevation. The shadow-casting directional
// light is placed at that sun's world position (local azimuth + env rotation) so
// its shadows stay consistent with the environment lighting.
const ENVIRONMENT_ROTATION_DEG = 1; // matches the editor's "Env rotation: 1°"
const HDR_SUN_LOCAL_AZIMUTH_DEG = 182; // atan2(x,z) of the baked sun in the un-rotated env
const HDR_SUN_ELEVATION_DEG = 39; // baked into the HDR

export const HomeScene = ({
  controlsRef,
  isAutoRotate = false,
  isSunLockedToCamera = false,
}) => {
  const { scene } = useHomeScene();
  const lightRef = React.useRef();

  // Environment rotation (matches the editor). Background + reflections rotate
  // together by this amount.
  const environmentRotationY = THREE.MathUtils.degToRad(
    ENVIRONMENT_ROTATION_DEG,
  );

  // Place the shadow-casting light at the HDR sun's world position for this
  // rotation (baked local azimuth + env rotation), so shadows agree with the
  // environment lighting.
  const sunRadius = 400; // Large radius to ensure it's outside the building models
  const elevRad = THREE.MathUtils.degToRad(HDR_SUN_ELEVATION_DEG);
  const azimRad = THREE.MathUtils.degToRad(
    HDR_SUN_LOCAL_AZIMUTH_DEG + ENVIRONMENT_ROTATION_DEG,
  );
  const fixedSunPosition = [
    sunRadius * Math.cos(elevRad) * Math.sin(azimRad),
    sunRadius * Math.sin(elevRad),
    sunRadius * Math.cos(elevRad) * Math.cos(azimRad),
  ];

  // Hardcoded camera position and target from the user's manual adjustment
  const orbitTarget = [-5.0, 20, -7.0];
  const defaultCameraPosition = [-173, 53, -88];

  const lightProps = {
    // Premium sun: a real specular glint on the tuned glass without blowing
    // out the scene, subtly warm daylight rather than neutral white.
    intensity: 1.0 * Math.PI,
    color: "#fff4e6",
    castShadow: false,
  };

  return (
    <Fragment>
      {/* 1. Perspective Camera — narrower FOV for telephoto aerial feel */}
      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.5}
        far={4000}
        position={defaultCameraPosition}
      >
        {isSunLockedToCamera && (
          <directionalLight
            ref={lightRef}
            position={[50, 0, 86.6]} // Same ~60º angle as viewer (0.5, 0, 0.866) but scaled out to 100 units so helper is visible
            {...lightProps}
          />
        )}
      </PerspectiveCamera>

      {/* 2. Interactive Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        target={orbitTarget}
        enablePan={true}
        enableZoom={true}
        autoRotate={isAutoRotate}
        autoRotateSpeed={2}
        // minDistance={120}
        // maxDistance={210}
        minPolarAngle={THREE.MathUtils.degToRad(5)}
        maxPolarAngle={Math.PI / 2 - THREE.MathUtils.degToRad(10)}
      />

      {/* 3. Environment Map (IBL) — manual TextureLoader + PMREM pipeline     */}
      {/*    Bypasses Drei's HDRJPGLoader which corrupts standard JPEG colorSpace */}
      {/*    Y-rotation slides the baked HDR sun to the target world azimuth,   */}
      {/*    rotating the visible background + all reflections together.        */}
      <EnvironmentSetup environmentRotation={[0, environmentRotationY, 0]} />

      {/* Ambient fill kept low now that the glass reflects the IBL and the
          directional sun does real work — enough to lift shadows without going
          flat/washed, so the scene reads as balanced premium daylight. */}
      <ambientLight intensity={0.4} color="#eef2f7" />

      {!isSunLockedToCamera && (
        <directionalLight
          ref={lightRef}
          position={fixedSunPosition}
          {...lightProps}
        />
      )}

      {/* 5. Render the GLB Scene hierarchy */}
      <primitive object={scene} />
    </Fragment>
  );
};

export default HomeScene;
