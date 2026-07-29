import { Fragment, useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import useSceneEnvironment from "./use-scene-environment";
import SceneGround from "@/features/scene-ground";
import GradientSky from "./gradient-sky";
import { GROUND_CONFIG, Preset } from "@/utils/constant";
import { useIsMobile } from "@/hooks/use-mobile";

const SceneEnvironment = ({ children }) => {
  const {
    environment,
    lighting,
    directIntensity,
    directColor,
    ambientIntensity,
    ambientColor,
    exposure,
    toneMapping,
    preset,
    config,
    fov,
    onPerformanceDecline,
    onPerformanceIncline,
  } = useSceneEnvironment();

  const { gl, scene } = useThree();
  const [lightTarget, setLightTarget] = useState(null);
  const isMobile = useIsMobile();

  // Disable hardware multisampling entirely because we are using SMAA (software anti-aliasing).
  // Combining MSAA and SMAA causes WebGL buffer conflicts (glBlitFramebuffer warning).
  const multisampling = 0;

  useEffect(() => {
    gl.toneMapping = Number(toneMapping);
    gl.toneMappingExposure = Math.pow(2, exposure);
    gl.needsUpdate = true;

    if (environment && environment.intensity !== undefined) {
      scene.environmentIntensity = environment.intensity;
    }
  }, [gl, scene, toneMapping, exposure, environment?.intensity]);

  const isAssetGenerator = preset === Preset.ASSET_GENERATOR;

  return (
    <Fragment>
      <PerformanceMonitor
        onDecline={onPerformanceDecline}
        onIncline={onPerformanceIncline}
      />
      <AdaptiveDpr />
      <AdaptiveEvents />

      <PerspectiveCamera
        makeDefault
        fov={fov}
        near={0.5}
        far={2000}
        position={[0, 10, config.cameraZ]}
      >
        {lighting.punctualLights && !isAssetGenerator && (
          <Fragment>
            <ambientLight
              intensity={ambientIntensity}
              color={ambientColor}
              name="ambient_light"
            />
            {/* Camera-attached directional: ~60° angle from camera forward (matches reference viewer) */}
            <directionalLight
              position={[0.5, 0, 0.866]}
              intensity={directIntensity}
              color={directColor}
              name="main_light"
              target={lightTarget || undefined}
            />
          </Fragment>
        )}
      </PerspectiveCamera>

      {/* Shared light target at the building's center */}
      <object3D ref={setLightTarget} position={[0, 10, 0]} />

      {isAssetGenerator && <hemisphereLight name="hemi_light" />}

      {!lighting.punctualLights && !isAssetGenerator && (
        <Fragment>
          <ambientLight intensity={ambientIntensity} color={ambientColor} />
          {/* Main sun light — primary illumination */}
          <directionalLight
            position={[30, 40, 30]}
            intensity={directIntensity}
            color={directColor}
            castShadow
            target={lightTarget || undefined}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={200}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.0001}
          />
          {/* Warm fill light — opposite side for depth (three-point lighting) */}
          <directionalLight
            position={[-20, 15, -20]}
            intensity={directIntensity * 0.3}
            color="#ffeedd"
          />
        </Fragment>
      )}

      {/* Reduce PMREM cubemap resolution on mobile to save ~80MB GPU memory.
          2048 is only needed for high-quality reflections on desktop.
          With background: false, the cubemap isn't visible — it only drives IBL lighting. */}
      <Environment
        {...environment}
        resolution={isMobile ? 256 : (environment?.resolution ?? 2048)}
        environmentIntensity={environment?.intensity ?? 1.0}
      />
      {/* 360° Gradient Sky Dome (Zenith: #2f7fca, Horizon: #bcdcf2) */}
      <GradientSky topColor="#2f7fca" bottomColor="#bcdcf2" />

      {/* Horizon Fog matching sky horizon color */}
      <fog attach="fog" args={["#bcdcf2", 60, 250]} />

      {/* Floor fill and grid lines composited in one shader on one surface */}
      <SceneGround {...GROUND_CONFIG} />
      {children}
      <EffectComposer multisampling={multisampling} stencilBuffer={false}>
        <SMAA />
      </EffectComposer>
    </Fragment>
  );
};

export default SceneEnvironment;
