import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

/**
 * Custom 360° Gradient Sky Shader Material.
 *
 * Blends smoothly from horizon color (bottom) to zenith color (top).
 * Rotationally symmetric around the Y-axis so the sky remains 100% stable,
 * vibrant, and uniform from all camera angles during orbit/pan/zoom.
 */
export const GradientSkyMaterial = shaderMaterial(
  {
    topColor: new THREE.Color("#2f7fca"),
    bottomColor: new THREE.Color("#bcdcf2"),
    offset: 10,
    exponent: 0.6,
  },
  /* glsl */ `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;

    void main() {
      float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
      float factor = max(pow(max(h, 0.0), exponent), 0.0);
      gl_FragColor = vec4(mix(bottomColor, topColor, factor), 1.0);
      #include <colorspace_fragment>
    }
  `
);

extend({ GradientSkyMaterial });

// Module-level Color constants — created once at module load time.
// Avoids allocating new THREE.Color() on every React render of GradientSky.
const _TOP_COLOR = new THREE.Color("#2f7fca");
const _BOTTOM_COLOR = new THREE.Color("#bcdcf2");

export const GradientSky = ({
  topColor = "#2f7fca",
  bottomColor = "#bcdcf2",
  exponent = 0.6,
}) => {
  // Reuse the module-level Color instances; only update their RGB values if
  // the incoming hex string changes (avoids a new allocation every render).
  _TOP_COLOR.set(topColor);
  _BOTTOM_COLOR.set(bottomColor);

  return (
    <mesh>
      <sphereGeometry args={[900, 32, 16]} />
      <gradientSkyMaterial
        key={GradientSkyMaterial.key}
        topColor={_TOP_COLOR}
        bottomColor={_BOTTOM_COLOR}
        exponent={exponent}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};

export default GradientSky;
