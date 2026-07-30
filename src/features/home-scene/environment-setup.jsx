import { useEffect, useMemo } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { HOME_ENV_PATH } from "@/utils/constant";
import { logger } from "@/utils/logger";
import buildEnvTexture from "./build-env-texture";

// 80m-nano-green.jpg is an 8-bit sRGB JPEG (4000x2000 equirectangular drone
// panorama), not a true HDR — its brightest pixel caps at ~1.0 linear.
//
// Slightly above parity: enough to strengthen the window and PV-panel reflections
// and to lift shaded facades in a direction-aware way, without pretending an LDR
// panorama can carry the whole fill. Measured cosine-weighted mean radiance is
// only 0.262 facing up / 0.434 facing sideways, so the global lift is done with
// HOME_EXPOSURE instead.
//
// One of the four balanced values — see the block comment in scene-lights.jsx
// before changing this.
const ENVIRONMENT_INTENSITY = 1.2;

/**
 * EnvironmentSetup — loads the equirectangular JPEG panorama and converts it to
 * a PMREM cubemap so every standard/physical material in the scene receives
 * image-based lighting, and the tuned window glass reflects the real sky.
 *
 * Why not Drei's <Environment>?
 * Drei v10.7 routes ALL .jpg files through HDRJPGLoader (a gainmap decoder).
 * Our file is a standard sRGB JPEG — not a gainmap. The loader falls back with
 * dummy metadata and Drei then sets colorSpace = 'srgb-linear', double-
 * linearizing the sRGB data and washing out every reflection. Loading through
 * THREE.TextureLoader keeps the colour space correct.
 */
const EnvironmentSetup = ({ environmentRotation = [0, 0, 0] }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  const texture = useLoader(THREE.TextureLoader, HOME_ENV_PATH);

  // Generate the prefiltered cubemap once per texture/renderer pair. Keeps both
  // the render target and the intermediate texture so cleanup can dispose them.
  const pmrem = useMemo(() => {
    if (!texture?.image) return null;

    // Downscaled working copy with the lower hemisphere lifted — see
    // build-env-texture.js. The panorama's dark green ground half is what made
    // facades go dull whenever the camera looked up at them.
    const envTexture = buildEnvTexture(texture.image);

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const target = pmremGenerator.fromEquirectangular(envTexture);
    pmremGenerator.dispose();

    logger.info("[EnvironmentSetup] PMREM generated", {
      width: target.texture.image?.width,
      height: target.texture.image?.height,
      colorSpace: target.texture.colorSpace,
    });

    return { target, envTexture };
  }, [texture, gl]);

  const pmremTarget = pmrem?.target ?? null;

  useEffect(() => {
    if (!pmremTarget) return;

    const prevEnv = scene.environment;
    const prevEnvIntensity = scene.environmentIntensity;
    const prevEnvRotation = scene.environmentRotation?.clone();

    scene.environment = pmremTarget.texture;
    scene.environmentIntensity = ENVIRONMENT_INTENSITY;
    scene.environmentRotation = new THREE.Euler(...environmentRotation);

    // ── CRITICAL FIX ────────────────────────────────────────────────────────
    // When scene.environment changes, Three.js must recompile every material's
    // shader program to include (or exclude) the envMap sampling code. In
    // r166+ the renderer does detect this change via a version counter on the
    // scene, but ONLY on the next render call that touches each material. If
    // compileAsync() already compiled the programs WITHOUT an envMap (because
    // this effect had not yet fired), those cached programs are stale and will
    // never sample scene.environment — making all IBL reflections invisible.
    //
    // Forcing needsUpdate on every PBR material guarantees the renderer
    // discards its cached program and recompiles with the envMap defines.
    // This is a one-time cost at mount; it does not run per frame.
    let recompiled = 0;
    scene.traverse((child) => {
      if (!child.isMesh && !child.isInstancedMesh) return;
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((mat) => {
        if (!mat) return;
        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          mat.needsUpdate = true;
          recompiled += 1;
        }
      });
    });

    // NOTE: scene.background is deliberately NOT set. 88RES-final.glb already
    // contains its own sky — node "PANO_Sphere " (radius ~670 units) carries the
    // same drone panorama in its emissive slot, so it renders unlit and the
    // camera always sits inside it. That dome is what you see, and it gives the
    // distant terrain correct parallax that an infinitely-far equirectangular
    // background cannot. Setting scene.background would only add a fully
    // occluded skybox draw every frame.

    logger.info("[EnvironmentSetup] Scene environment applied", {
      recompiledMaterials: recompiled,
      envIntensity: ENVIRONMENT_INTENSITY,
    });

    // Ensure R3F schedules a render so the recompiled materials are drawn
    // immediately with the IBL, rather than waiting for the next user gesture
    // or animation tick.
    invalidate();

    return () => {
      scene.environment = prevEnv;
      scene.environmentIntensity = prevEnvIntensity;
      if (prevEnvRotation) scene.environmentRotation = prevEnvRotation;
    };
  }, [pmremTarget, scene, environmentRotation, invalidate]);

  // Release the PMREM render target and the intermediate equirect texture when
  // this component goes away, otherwise navigating home <-> inventory repeatedly
  // leaks a cubemap and a 2048x1024 canvas texture each time.
  useEffect(() => {
    if (!pmrem) return;
    return () => {
      pmrem.target.dispose();
      pmrem.envTexture.dispose();
    };
  }, [pmrem]);

  return null;
};

export default EnvironmentSetup;
