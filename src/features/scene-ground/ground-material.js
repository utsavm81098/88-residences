import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { GROUND_CONFIG } from "@/utils/constant";

/**
 * Single-pass ground material.
 *
 * Floor fill, cell lines and section lines are composited in ONE fragment shader
 * on ONE surface. Because there is only one surface there is only one depth value
 * per pixel, so Z-fighting between the floor and the grid is structurally
 * impossible — no y-offset, no polygonOffset, no render-order trickery required.
 *
 * All configurable values (colors, sizes, thicknesses, fade) are managed in
 * GROUND_CONFIG (constant.js) — the single source of truth. The defaults object
 * below reads from GROUND_CONFIG so there is no duplication to keep in sync.
 */
export const GroundMaterial = shaderMaterial(
  {
    floorColor: new THREE.Color(GROUND_CONFIG.floorColor),
    cellColor: new THREE.Color(GROUND_CONFIG.cellColor),
    sectionColor: new THREE.Color(GROUND_CONFIG.sectionColor),
    cellSize: GROUND_CONFIG.cellSize,
    sectionSize: GROUND_CONFIG.sectionSize,
    cellThickness: GROUND_CONFIG.cellThickness,
    sectionThickness: GROUND_CONFIG.sectionThickness,
    fadeDistance: GROUND_CONFIG.fadeDistance,
    lodStart: GROUND_CONFIG.lodStart,
    lodEnd: GROUND_CONFIG.lodEnd,
  },
  /* glsl */ `
    varying vec3 vWorld;

    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorld = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  /* glsl */ `
    varying vec3 vWorld;

    uniform vec3  floorColor;
    uniform vec3  cellColor;
    uniform vec3  sectionColor;
    uniform float cellSize;
    uniform float sectionSize;
    uniform float cellThickness;
    uniform float sectionThickness;
    uniform float fadeDistance;
    uniform float lodStart;
    uniform float lodEnd;

    // Per-axis line coverage.
    //   .x = lines running along Z (spacing sampled on the X axis)
    //   .y = lines running along X (spacing sampled on the Z axis)
    vec2 gridCoverage(vec2 p, float size, float thickness) {
      if (thickness <= 0.0) return vec2(0.0);
      vec2 c   = p / size;
      vec2 dd  = fwidth(c) + 1e-8;                        // +eps: never divide by 0
      vec2 g   = abs(fract(c - 0.5) - 0.5) / (dd * thickness);
      vec2 cov = 1.0 - min(g, 1.0);                       // AA'd, ~2*thickness px wide
      vec2 lod = 1.0 - smoothstep(lodStart, lodEnd, dd);
      return cov * lod;
    }

    void main() {
      vec2 cell = gridCoverage(vWorld.xz, cellSize,    cellThickness);
      vec2 sect = gridCoverage(vWorld.xz, sectionSize, sectionThickness);

      vec3 col = floorColor;
      col = mix(col, cellColor,    max(cell.x, cell.y));
      col = mix(col, sectionColor, max(sect.x, sect.y)); // section last => wins at crossings

      // Horizon fade — starts at 65% of fadeDistance, fully gone at fadeDistance.
      float fadeStart = fadeDistance * 0.65;
      float d = distance(cameraPosition.xz, vWorld.xz);
      float a = 1.0 - smoothstep(fadeStart, fadeDistance, d);

      // Must discard: depthWrite is on, so without this the fully-faded far field
      // would still stamp depth.
      if (a <= 0.001) discard;

      gl_FragColor = vec4(col, a);

      #include <colorspace_fragment>
    }
  `,
);

extend({ GroundMaterial });
