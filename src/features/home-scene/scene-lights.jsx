import { useMemo } from "react";
import { Fragment } from "react";
import * as THREE from "three";

/**
 * SceneLights — a FIXED world-space sun, plus ambient fill.
 *
 * Deliberately NOT parented to the camera. A camera-parented light sits at a
 * local offset whose length (1 unit) is negligible against the orbit radius
 * (~225 units), so its direction collapses to "from the camera toward the
 * target" — a headlight. That makes the scene's lighting a function of camera
 * orientation: pitch up and the light arrives from overhead, pitch down and it
 * arrives sideways. Every vertical drag re-lights the whole scene, which is
 * exactly the wrong behaviour for an architectural view.
 *
 * A fixed sun is stable: moving the camera changes what you see, never how the
 * site is lit. It is also consistent with the baked panorama — the sun is placed
 * at the position measured off 80m-nano-green.jpg (~182° local azimuth, ~39°
 * elevation; the elevation is independently confirmed by the sun's bright spot
 * landing at v ≈ 0.285 of the image height), so the highlight direction agrees
 * with the sky in the PANO_Sphere dome and with the IBL reflections.
 *
 * Trade-off worth knowing: because the sun is fixed, orbiting to the far side
 * puts the roofs in shade, exactly as a real building at a real time of day.
 * Reflected environment light, not the sun, carries those faces.
 */

// Sun position measured off the panorama. ENVIRONMENT_ROTATION_DEG is added so the
// light tracks the environment if that rotation is ever tuned.
const HDR_SUN_LOCAL_AZIMUTH_DEG = 182;
const HDR_SUN_ELEVATION_DEG = 39;
// Far enough out to sit clear of the buildings, well inside the ~670-unit dome.
const SUN_RADIUS = 400;

// --- Exposure balance -------------------------------------------------------
// FOUR numbers control the look of this scene and they are balanced against each
// other. Never change one alone:
//
//   HOME_EXPOSURE          utils/constant.js         0.4  (-> 1.32x)
//   SUN_INTENSITY          here                      1.0 * PI
//   AMBIENT_INTENSITY      here                      0.30
//   ENVIRONMENT_INTENSITY  environment-setup.jsx     1.2
//
// Calibrated against the panorama's MEASURED linear irradiance — cosine-weighted
// mean radiance of 0.262 facing up, 0.434 facing sideways, 0.314 facing down. The
// upward figure is the surprising one: the panorama's zenith is deep navy, so
// roofs and lawns receive very little image-based light and depend on the sun.
//
// Two earlier attempts and why they failed, so this is not re-litigated:
//   ambient 0.40 / sun 1.0PI / env 1.0 / exp 1.0
//     -> sunlit facade 0.83, roofs blown out from above.
//   ambient 0.12 / sun 0.75PI / env 1.3 / exp 1.0
//     -> whole scene too dark (grass 0.29, trees 0.12). The mistake was expecting
//        an 8-bit sRGB JPEG to carry the fill an HDR would; it physically cannot.
//
// The fix was global exposure, not light intensities. These values put the
// modelled range at roughly 0.19..0.91 with a ~5:1 contrast ratio.
const AMBIENT_INTENSITY = 0.3;
const AMBIENT_COLOR = "#eef2f7";
const SUN_INTENSITY = 1.0 * Math.PI;
const SUN_COLOR = "#fff4e6";

const SceneLights = ({ environmentRotationDeg = 0 }) => {
  const sunPosition = useMemo(() => {
    const elevation = THREE.MathUtils.degToRad(HDR_SUN_ELEVATION_DEG);
    const azimuth = THREE.MathUtils.degToRad(
      HDR_SUN_LOCAL_AZIMUTH_DEG + environmentRotationDeg,
    );

    return [
      SUN_RADIUS * Math.cos(elevation) * Math.sin(azimuth),
      SUN_RADIUS * Math.sin(elevation),
      SUN_RADIUS * Math.cos(elevation) * Math.cos(azimuth),
    ];
  }, [environmentRotationDeg]);

  return (
    <Fragment>
      {/* Fill light. Keeps shaded facades readable without flattening them, now
          that IBL and the sun do the directional work. */}
      <ambientLight intensity={AMBIENT_INTENSITY} color={AMBIENT_COLOR} />

      {/* Shadows are off — no shadow map is configured on this Canvas — so this
          light exists for diffuse shaping and the specular glint on glazing and
          the rooftop solar panels. Its default target is the world origin, which
          is within a few units of the site centre, so the direction is correct
          without an explicit target object. */}
      <directionalLight
        position={sunPosition}
        intensity={SUN_INTENSITY}
        color={SUN_COLOR}
        castShadow={false}
      />
    </Fragment>
  );
};

export default SceneLights;
