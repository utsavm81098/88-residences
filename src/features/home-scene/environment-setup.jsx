import { useEffect, useMemo } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { getAssetPath } from "@/utils/constant";
import { logger } from "@/utils/logger";

const ENV_PATH = getAssetPath("/hdr/80m-nano-green.jpg");

// 80m-nano-green.jpg is an 8-bit sRGB JPEG, not a true HDR — its brightest
// pixel caps at ~1.0 linear, far below a real sun's radiance. This multiplier
// compensates so IBL lighting reaches a comparable brightness to a true HDR
// source, without swapping the (deliberately real, site-photo) asset itself.
const ENVIRONMENT_INTENSITY = 1.0;

/**
 * EnvironmentSetup — manually loads the equirectangular JPEG via
 * Three.js TextureLoader (correct sRGB handling) and converts it
 * to a PMREM cubemap for IBL reflections.
 *
 * Why not Drei's <Environment>?
 * Drei v10.7 routes ALL .jpg files through HDRJPGLoader (gainmap decoder).
 * Our file is a standard sRGB JPEG — not a gainmap. The loader falls back
 * with dummy metadata and Drei then sets colorSpace = 'srgb-linear',
 * double-linearizing the sRGB data and washing out reflections.
 */
const EnvironmentSetup = ({ environmentRotation = [0, 0, 0] }) => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  // Load the equirectangular JPEG via standard TextureLoader (sRGB-correct)
  const texture = useLoader(THREE.TextureLoader, ENV_PATH);

  // Generate the PMREM cubemap once the texture is available
  const envMap = useMemo(() => {
    if (!texture) return null;

    // Mark as equirectangular so PMREMGenerator processes it correctly
    texture.mapping = THREE.EquirectangularReflectionMapping;
    // TextureLoader already defaults to SRGBColorSpace for images — ensure it
    texture.colorSpace = THREE.SRGBColorSpace;

    // Generate prefiltered PMREM from equirectangular source
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    const pmremRT = pmremGenerator.fromEquirectangular(texture);
    pmremGenerator.dispose();

    logger.info("[EnvironmentSetup] PMREM generated", {
      width: pmremRT.texture.image?.width,
      height: pmremRT.texture.image?.height,
      colorSpace: pmremRT.texture.colorSpace,
    });

    return pmremRT.texture;
  }, [texture, gl]);

  // Apply environment map and background to the scene
  useEffect(() => {
    if (!envMap) return;

    const prevEnv = scene.environment;
    const prevBg = scene.background;
    const prevBgBlurriness = scene.backgroundBlurriness;
    const prevEnvIntensity = scene.environmentIntensity;
    const prevEnvRotation = scene.environmentRotation?.clone();
    const prevBgRotation = scene.backgroundRotation?.clone();

    // Set environment (for IBL reflections on materials)
    scene.environment = envMap;
    scene.environmentIntensity = ENVIRONMENT_INTENSITY;
    scene.environmentRotation = new THREE.Euler(...environmentRotation);

    // Set background (visible panorama behind the scene)
    // NOTE: backgroundRotation is a separate Euler from environmentRotation in
    // three.js — background and environment are otherwise the same texture,
    // so without this they render 90° out of sync with each other (the sky
    // behind the model vs. what glass/metal reflects would not match).
    scene.background = envMap;
    scene.backgroundBlurriness = 0;
    scene.backgroundRotation = new THREE.Euler(...environmentRotation);

    logger.info("[EnvironmentSetup] Scene environment applied");

    // Cleanup: restore previous state on unmount
    return () => {
      scene.environment = prevEnv;
      scene.background = prevBg;
      scene.backgroundBlurriness = prevBgBlurriness;
      scene.environmentIntensity = prevEnvIntensity;
      if (prevEnvRotation) {
        scene.environmentRotation = prevEnvRotation;
      }
      if (prevBgRotation) {
        scene.backgroundRotation = prevBgRotation;
      }
    };
  }, [envMap, scene, environmentRotation]);

  return null;
};

export default EnvironmentSetup;
