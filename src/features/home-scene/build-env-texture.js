import * as THREE from "three";

/**
 * Turns the equirectangular site panorama into a texture suitable for IBL.
 *
 * Two things happen here, and neither touches the visible sky:
 *
 * 1. DOWNSCALE. The source is 4000x2000. PMREM only needs enough resolution to
 *    prefilter a few mip levels, so a 2048x1024 working copy is
 *    indistinguishable in reflections and costs a quarter of the intermediate
 *    memory — which matters on mobile.
 *
 * 2. LIFT THE LOWER HEMISPHERE. Below the horizon the panorama is dark green
 *    fields. A vertical window reflects the sky when the camera is above it and
 *    reflects the ground when the camera is below it, so leaving that half dark
 *    is what made facades go dull as the camera dropped. Blending the lower half
 *    toward a neutral tone keeps reflections consistent from every elevation.
 *
 * The model's own PANO_Sphere dome still supplies the sky you actually see, and
 * it is untouched — so this only changes what surfaces REFLECT, never the
 * background.
 */

const WORKING_WIDTH = 2048;
const WORKING_HEIGHT = 1024;

// Neutral tone the ground half is blended toward: a desaturated sky-ground grey
// that reads as ambient bounce rather than as green field.
const GROUND_LIFT_COLOR = { r: 154, g: 167, b: 160 };
// How far the blend goes at the very bottom of the sphere (0 = untouched).
const GROUND_LIFT_STRENGTH = 0.7;
// Blend ramps in over this fraction of the lower half, so the horizon does not
// show a hard seam in reflections.
const HORIZON_FEATHER = 0.18;

/**
 * @param {HTMLImageElement|ImageBitmap} image equirectangular source
 * @returns {THREE.CanvasTexture} ready for PMREMGenerator.fromEquirectangular
 */
export const buildEnvTexture = (image) => {
  const canvas = document.createElement("canvas");
  canvas.width = WORKING_WIDTH;
  canvas.height = WORKING_HEIGHT;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, WORKING_WIDTH, WORKING_HEIGHT);

  const frame = ctx.getImageData(0, 0, WORKING_WIDTH, WORKING_HEIGHT);
  const px = frame.data;
  const horizonRow = WORKING_HEIGHT / 2;

  for (let y = horizonRow; y < WORKING_HEIGHT; y++) {
    // 0 at the horizon, 1 at the nadir.
    const depth = (y - horizonRow) / (WORKING_HEIGHT - horizonRow);
    const ramp = Math.min(1, depth / HORIZON_FEATHER);
    const blend = ramp * GROUND_LIFT_STRENGTH;
    if (blend <= 0) continue;

    const rowStart = y * WORKING_WIDTH * 4;
    for (let x = 0; x < WORKING_WIDTH; x++) {
      const i = rowStart + x * 4;
      px[i] += (GROUND_LIFT_COLOR.r - px[i]) * blend;
      px[i + 1] += (GROUND_LIFT_COLOR.g - px[i + 1]) * blend;
      px[i + 2] += (GROUND_LIFT_COLOR.b - px[i + 2]) * blend;
    }
  }

  ctx.putImageData(frame, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

export default buildEnvTexture;
