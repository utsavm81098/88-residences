import * as THREE from "three";

const WORKING_WIDTH = 2048;
const WORKING_HEIGHT = 1024;
const GROUND_BOUNCE = { r: 150, g: 164, b: 158 };

/**
 * Creates a modest-resolution PMREM source from the supplied LDR panorama.
 * The visible panorama remains untouched inside the GLB; this texture only
 * supplies softer, less green ambient reflections to PBR materials.
 */
export const buildEnvTexture = (image) => {
  const canvas = document.createElement("canvas");
  canvas.width = WORKING_WIDTH;
  canvas.height = WORKING_HEIGHT;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, WORKING_WIDTH, WORKING_HEIGHT);

  const frame = context.getImageData(0, 0, WORKING_WIDTH, WORKING_HEIGHT);
  const horizon = WORKING_HEIGHT / 2;

  for (let y = horizon; y < WORKING_HEIGHT; y += 1) {
    const depth = (y - horizon) / horizon;
    const blend = Math.min(1, depth / 0.22) * 0.5;
    const rowStart = y * WORKING_WIDTH * 4;

    for (let x = 0; x < WORKING_WIDTH; x += 1) {
      const index = rowStart + x * 4;
      frame.data[index] += (GROUND_BOUNCE.r - frame.data[index]) * blend;
      frame.data[index + 1] += (GROUND_BOUNCE.g - frame.data[index + 1]) * blend;
      frame.data[index + 2] += (GROUND_BOUNCE.b - frame.data[index + 2]) * blend;
    }
  }

  context.putImageData(frame, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
};

export default buildEnvTexture;
