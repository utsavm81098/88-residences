/**
 * Pure camera-framing maths for the home masterplan scene. No React, no
 * three.js — so it can be reasoned about and tested in isolation.
 *
 * The problem: the site is 55 x 19 x 183 units, i.e. 3.3:1 in plan. A single
 * hardcoded camera distance cannot frame it on both a 21:9 desktop and a
 * portrait phone — measured, a portrait phone needs ~484 units where a wide
 * desktop needs ~192. So the distance is derived from the live canvas aspect.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Vertical FOV for a given aspect. Widens below the reference aspect so the
 * site stays in frame, clamped to avoid fish-eye. Uses a fixed reference aspect
 * so the value never jumps as the window crosses a responsive breakpoint.
 */
export const fovForAspect = ({ baseFov, baseAspect, maxFov, aspect }) => {
  if (!aspect || !Number.isFinite(aspect) || aspect >= baseAspect) return baseFov;

  const widened =
    2 * Math.atan(Math.tan((baseFov * D2R) / 2) * (baseAspect / aspect)) * R2D;

  return Math.min(maxFov, Math.round(widened));
};

/** Half-angles of the frustum, in degrees, for a vertical FOV and aspect. */
export const frustumHalfAngles = ({ fovDeg, aspect }) => ({
  halfV: fovDeg / 2,
  halfH: Math.atan(Math.tan((fovDeg * D2R) / 2) * aspect) * R2D,
});

/** The 8 corners of an axis-aligned box, as flat [x,y,z] triples. */
const cornersOf = ({ min, max }) => {
  const out = [];
  for (let i = 0; i < 8; i++) {
    out.push([i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]]);
  }
  return out;
};

/**
 * Camera position for a spherical offset about `target`.
 * Matches three.js OrbitControls' convention, where azimuth theta = atan2(x, z).
 */
export const orbitPosition = ({ target, azimuthDeg, elevationDeg, distance }) => {
  const el = elevationDeg * D2R;
  const az = azimuthDeg * D2R;
  const horizontal = distance * Math.cos(el);

  return [
    target[0] + horizontal * Math.sin(az),
    target[1] + distance * Math.sin(el),
    target[2] + horizontal * Math.cos(az),
  ];
};

/**
 * Largest half-angles the box subtends from a camera at the given spherical
 * offset. Returns degrees. Allocation-free apart from the returned object.
 */
const halfAnglesFor = (corners, target, azimuthDeg, elevationDeg, distance) => {
  const eye = orbitPosition({ target, azimuthDeg, elevationDeg, distance });

  // Forward = eye -> target.
  let fx = target[0] - eye[0];
  let fy = target[1] - eye[1];
  let fz = target[2] - eye[2];
  const flen = Math.hypot(fx, fy, fz) || 1;
  fx /= flen;
  fy /= flen;
  fz /= flen;

  // Right = forward x worldUp. Degenerate only when looking straight up/down,
  // which the polar limits forbid; fall back to +X so it can never produce NaN.
  let rx = fy * 0 - fz * 1;
  let ry = fz * 0 - fx * 0;
  let rz = fx * 1 - fy * 0;
  const rlen = Math.hypot(rx, ry, rz);
  if (rlen < 1e-6) {
    rx = 1;
    ry = 0;
    rz = 0;
  } else {
    rx /= rlen;
    ry /= rlen;
    rz /= rlen;
  }

  // Up = right x forward (already orthonormal).
  const ux = ry * fz - rz * fy;
  const uy = rz * fx - rx * fz;
  const uz = rx * fy - ry * fx;

  let maxH = 0;
  let maxV = 0;

  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const dx = c[0] - eye[0];
    const dy = c[1] - eye[1];
    const dz = c[2] - eye[2];

    const z = dx * fx + dy * fy + dz * fz;
    const x = dx * rx + dy * ry + dz * rz;
    const y = dx * ux + dy * uy + dz * uz;

    const h = Math.abs(Math.atan2(x, z));
    const v = Math.abs(Math.atan2(y, z));
    if (h > maxH) maxH = h;
    if (v > maxV) maxV = v;
  }

  return { h: maxH * R2D, v: maxV * R2D };
};

/**
 * Smallest distance at which the whole box fits the frustum from EVERY azimuth.
 *
 * Sweeping azimuth matters: at the broadside azimuth the 183-unit long axis
 * spans the screen, at the end-on azimuth only 55 units do. Taking the
 * worst case is what makes the orbit frame correctly in all directions.
 *
 * Fitting the bounding SPHERE instead would be azimuth-independent and simpler,
 * but over-frames by 54% at desktop aspect (319 vs 207) because the site is so
 * elongated — the buildings would render needlessly small.
 *
 * Cost is ~40 bisection steps x 72 azimuths x 8 corners, well under a
 * millisecond, and it only runs on resize.
 */
export const fitDistance = ({
  bbox,
  target,
  fovDeg,
  aspect,
  elevationDeg,
  margin = 1.06,
  azimuthSamples = 72,
  minDistance = 50,
  maxDistance = 1500,
}) => {
  const { halfH, halfV } = frustumHalfAngles({ fovDeg, aspect });
  const corners = cornersOf(bbox);

  const fits = (distance) => {
    for (let i = 0; i < azimuthSamples; i++) {
      const azimuthDeg = (i * 360) / azimuthSamples;
      const { h, v } = halfAnglesFor(corners, target, azimuthDeg, elevationDeg, distance);
      if (h * margin > halfH || v * margin > halfV) return false;
    }
    return true;
  };

  // Guard against an aspect so extreme that even maxDistance cannot contain it.
  if (!fits(maxDistance)) return maxDistance;

  let lo = minDistance;
  let hi = maxDistance;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }

  return hi;
};

/**
 * Everything the scene needs for a given canvas aspect: the FOV, the fitted
 * distance, the camera position, and zoom limits scaled to that distance so
 * they mean the same thing on a phone as on a desktop.
 */
export const solveFraming = ({ camera, aspect }) => {
  const isMobileOrTablet = aspect > 0 && aspect < 1.35;
  
  const fov = fovForAspect({
    baseFov: camera.baseFov,
    baseAspect: camera.baseAspect,
    maxFov: isMobileOrTablet && camera.mobileMaxFov ? camera.mobileMaxFov : camera.maxFov,
    aspect,
  });

  const margin = isMobileOrTablet && camera.mobileMargin !== undefined ? camera.mobileMargin : camera.margin;

  const distance = fitDistance({
    bbox: camera.bbox,
    target: camera.target,
    fovDeg: fov,
    aspect,
    elevationDeg: camera.elevationDeg,
    margin,
  });

  return {
    fov,
    distance,
    position: orbitPosition({
      target: camera.target,
      azimuthDeg: camera.azimuthDeg,
      elevationDeg: camera.elevationDeg,
      distance,
    }),
    minDistance: distance * camera.minDistanceScale,
    // Hard ceiling keeps the camera inside the model's own PANO_Sphere dome.
    maxDistance: Math.min(distance * camera.maxDistanceScale, camera.maxDistanceCap),
  };
};
