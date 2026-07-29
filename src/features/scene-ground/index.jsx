import * as THREE from "three";
import { GroundMaterial } from "./ground-material";

/**
 * SceneGround - flat design-coloured floor carrying 2m cell lines and 10m section
 * lines, drawn as a SINGLE surface. See ground-material.js for why that matters.
 *
 * - rotation -PI/2 maps the plane's +Z normal to +Y, so FrontSide faces up.
 *   (drei's Grid uses BackSide only because it swizzles position.xzy in the vertex
 *   shader, which flips winding — that does not apply here.)
 * - y = 0 exactly, so the building at y = 0.02 sits flush on it.
 * - renderOrder -1 puts the ground first among transparents, below the existing
 *   ladder: building 0, glass 1, unit overlays 10, outlines 11, labels 100.
 *   The unit overlays are transparent with depthWrite:false, so this is required,
 *   not cosmetic.
 * - depthWrite is safe because nothing ever renders beneath the ground, and it
 *   keeps the opaque building correctly occluding it.
 */
const SceneGround = ({ size, ...uniforms }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} renderOrder={-1}>
    <planeGeometry args={[size, size]} />
    <groundMaterial
      key={GroundMaterial.key}
      transparent
      depthWrite={true}
      side={THREE.FrontSide}
      {...uniforms}
    />
  </mesh>
);

export default SceneGround;
