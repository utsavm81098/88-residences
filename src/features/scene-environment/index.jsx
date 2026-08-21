import { Fragment, useState, useEffect, Suspense } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  Environment,
  PerformanceMonitor,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import useSceneEnvironment from "./use-scene-environment";
import SceneGround from "@/features/scene-ground";
import GradientSky from "./gradient-sky";
import { GROUND_CONFIG, Preset } from "@/utils/constant";
import { useIsMobile } from "@/hooks/use-mobile";
import { ComponentErrorBoundary } from "@/components/error-boundary";

// Inside a <Canvas>, an error boundary's fallback is part of the R3F scene
// graph, not the DOM — it cannot render the default shadcn <Card> fallback
// (see components/error-boundary/error-fallback.jsx). Rendering nothing lets
// the always-mounted punctual lights below keep illuminating the building
// instead of taking the whole unified canvas down over a single failed HDR.
const NullFallback = () => null;

const SceneEnvironment = ({ children, active = true }) => {
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
  const camera = useThree((state) => state.camera);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!active || !gl) {
      if (scene.fog) scene.fog = null;
      return;
    }
    gl.toneMapping = Number(toneMapping);
    gl.toneMappingExposure = Math.pow(2, exposure);
    gl.needsUpdate = true;

    if (environment && environment.intensity !== undefined) {
      scene.environmentIntensity = environment.intensity;
    }

    // Reset camera position and target explicitly when activating Inventory
    // so it doesn't inherit the high-elevation camera from HomeScene
    camera.position.set(0, 10, config.cameraZ);
    camera.fov = fov;
    camera.near = 0.5;
    camera.far = 2000;
    camera.lookAt(0, 10, 0);
    camera.updateProjectionMatrix();

    return () => {
      if (scene.fog) scene.fog = null;
    };
  }, [
    gl,
    scene,
    toneMapping,
    exposure,
    environment?.intensity,
    active,
    config.cameraZ,
    fov,
    camera,
  ]);

  // Continuous self-heal, mirroring home-scene/environment-setup.jsx's own
  // per-frame guard. The two scenes share one gl/scene under the unified
  // canvas (containers/scene-canvas), so a stray write from the other side —
  // or just a one-frame race at the exact moment the two views swap — must
  // not go uncorrected until the next full activation. Cheap: only writes
  // when a mismatch is actually found.
  useFrame(() => {
    if (!active || !gl) return;
    const expectedToneMapping = Number(toneMapping);
    const expectedExposure = Math.pow(2, exposure);
    const expectedIntensity = environment?.intensity;

    const mismatched =
      gl.toneMapping !== expectedToneMapping ||
      gl.toneMappingExposure !== expectedExposure ||
      (expectedIntensity !== undefined &&
        scene.environmentIntensity !== expectedIntensity);

    if (!mismatched) return;

    gl.toneMapping = expectedToneMapping;
    gl.toneMappingExposure = expectedExposure;
    if (expectedIntensity !== undefined) {
      scene.environmentIntensity = expectedIntensity;
    }
    gl.needsUpdate = true;
  });

  const isAssetGenerator = preset === Preset.ASSET_GENERATOR;

  return (
    <group visible={active}>
      {/* Gated on `active`, not unmounted structurally like the rest of this
          tree below: PerformanceMonitor samples wall-clock time
          (performance.now), not the R3F clock, and would otherwise keep
          sampling the shared canvas while Home is the visible view and trip
          onDecline from an unrelated scene's frame times. Cheap to
          mount/unmount — no GPU/network cost, unlike Environment/lights/
          ground below. */}
      {active && (
        <PerformanceMonitor
          onDecline={onPerformanceDecline}
          onIncline={onPerformanceIncline}
        />
      )}
      {active && <AdaptiveDpr />}
      <AdaptiveEvents />

      {/* Lights, the environment map, the ground and the sky dome all stay
          mounted permanently (never conditionally unmounted on `active`),
          matching features/home-scene/index.jsx's own EnvironmentSetup/
          SceneLights, which never unmount either. The wrapping <group
          visible={active}> above is what actually hides them from Home:
          three.js's renderer skips an entire invisible subtree during scene
          traversal — including any lights inside it — so an invisible
          directionalLight contributes nothing to Home's rendering, with zero
          need to tear it down and rebuild it (and recompile SceneGround's
          shader, and re-run the PMREM generator) on every single
          Home <-> Inventory toggle. That churn was the actual source of the
          "environment/lighting sometimes missing after navigating back" and
          the occasional canvas crash on repeated navigation: every toggle
          re-triggered Suspense-crossing async loads for no reason. */}
      {lighting.punctualLights && !isAssetGenerator && (
        <Fragment>
          <ambientLight
            intensity={ambientIntensity}
            color={ambientColor}
            name="ambient_light"
          />
          {/* Main punctual light */}
          <directionalLight
            position={[0.5, 0, 0.866]}
            intensity={directIntensity}
            color={directColor}
            name="main_light"
            target={lightTarget || undefined}
          />
        </Fragment>
      )}

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

      {/* Environment is the one exception kept gated on `active` (mounted/
          unmounted, not just hidden): drei's underlying EnvironmentCube runs
          its scene.environment-assigning layout effect on EVERY render with
          no dependency array, so leaving it mounted while inactive would
          fight Home's own environment every single frame Home is visible.
          Isolated in its own error boundary with a scene-graph-safe null
          fallback: if the HDR fails to load (a real failure mode on a flaky
          mobile connection), the punctual lights above keep the building lit
          instead of the failure taking down the entire unified canvas. */}
      {active && (
        <ComponentErrorBoundary
          name="Inventory Environment Map"
          FallbackComponent={NullFallback}
          // Auto-retries on every re-activation instead of staying blank for
          // the rest of the session after one failed HDR load.
          resetKeys={[active]}
        >
          {/* Reduce PMREM cubemap resolution on mobile to save ~80MB GPU memory.
              2048 is only needed for high-quality reflections on desktop.
              With background: false, the cubemap isn't visible — it only drives IBL lighting. */}
          <Suspense fallback={null}>
            <Environment
              {...environment}
              resolution={isMobile ? 256 : (environment?.resolution ?? 2048)}
              environmentIntensity={environment?.intensity ?? 1.0}
            />
          </Suspense>
        </ComponentErrorBoundary>
      )}
      {/* 360° Gradient Sky Dome (Zenith: #2f7fca, Horizon: #bcdcf2) */}
      <GradientSky topColor="#2f7fca" bottomColor="#bcdcf2" />

      {/* Horizon Fog matching sky horizon color. Gated on `active` (a plain
          THREE.Fog with no GPU/network cost to remount) rather than relying
          solely on the cross-scene guards below, so Inventory's fog can
          never leak into Home even for one frame. */}
      {active && <fog attach="fog" args={["#bcdcf2", 60, 250]} />}

      {/* Floor fill and grid lines composited in one shader on one surface */}
      <SceneGround {...GROUND_CONFIG} />
      {children}
    </group>
  );
};

export default SceneEnvironment;
