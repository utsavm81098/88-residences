import { useEffect, useMemo } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { getAssetPath } from "@/utils/constant";
import { logger } from "@/utils/logger";

const ENV_PATH = getAssetPath("/hdr/80m-nano-green.jpg");

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
const EnvironmentSetup = ({ environmentRotation = [0, Math.PI / 2, 0] }) => {
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

    // Set environment (for IBL reflections on materials)
    scene.environment = envMap;
    scene.environmentIntensity = 1.0;
    scene.environmentRotation = new THREE.Euler(...environmentRotation);

    // Set background (visible panorama behind the scene)
    scene.background = envMap;
    scene.backgroundBlurriness = 0;

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
    };
  }, [envMap, scene, environmentRotation]);

  return null;
};

export default EnvironmentSetup;
