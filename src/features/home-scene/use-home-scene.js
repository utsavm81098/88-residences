import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { configureLoader } from "@/utils/preloader";
import { HOME_MODEL_PATH } from "@/utils/constant";
import { logger } from "@/utils/logger";

// Marks the loaded GLB so the retune runs exactly once, even under StrictMode's
// double-invoke or an HMR re-render. We mutate the cached scene in place rather
// than cloning it: a clone would allocate a second full node graph for a scene
// that is only ever mounted once.
const TUNED_FLAG = "__homeSceneTuned";

/**
 * The eleven glazing materials in 88RES-final-opt.glb, matched by EXACT name.
 *
 * Do NOT replace this with a substring regex:
 *  - /grass/i would catch 11 real lawn materials (_GRASS_01_1, adskMatGrass_ENTER,
 *    adskMatGRASS_GYMBO_01, adskMatGRASS__POOL_01/02, ...) and mirror the lawns.
 *    Only WIN_GRASS is glass — it is an authoring typo for WIN_GLASS.
 *  - /balcon/i would catch adskMatD__FL__BALCON, which is a balcony FLOOR.
 *  - /glass|window/i alone MISSES the four WIN_* entries below, because none of
 *    them contains either word.
 */
const GLAZING_MATERIALS = new Set([
  "GLASS",
  "Balcon_Glass",
  "Win_Glass",
  "Win_Glass_1",
  "Win_Glass_2",
  "WIN_GRASS",
  "WIN_BigWAll",
  "adskMatWIN_BigWAll",
  "adskMatG__Wall_WIN",
  "Material__2556",
  "Material__2558",
]);

/**
 * Dielectric glazing.
 *
 * This deliberately does NOT use metalness 1.0. A pure metal has no diffuse
 * term, so the pane's colour becomes 100% reflected environment: with the camera
 * high the facade mirrors bright sky, with the camera low it mirrors the
 * panorama's dark green fields. That is what made the buildings swing between
 * bright and dull as the camera moved up and down.
 *
 * At metalness 0 the base colour is always present and Fresnel supplies
 * reflection only at grazing angles, which is how real architectural glazing
 * behaves — and the brightness stops tracking camera elevation.
 */
const GLAZING_TUNING = {
  metalness: 0.0,
  roughness: 0.08,
  ior: 1.5,
  // 1.4 rather than 1.0: the panorama is an 8-bit sRGB JPEG whose measured
  // cosine-weighted mean radiance is only 0.434 facing sideways. A true HDR sky
  // would carry 3-5× more energy, so we boost the multiplier to compensate
  // without over-driving specular highlights (NeutralToneMapping rolls those off).
  envMapIntensity: 1.4,
  clearcoat: 1.0,
  clearcoatRoughness: 0.06,
  specularIntensity: 1.0,
  // A little opacity keeps a stable base tone, so a pane whose reflection points
  // at dark ground still reads as glass rather than going black.
  opacity: 0.9,
};

/**
 * The seven railing materials. These are wood and concrete with basecolour
 * textures, so the glazing treatment would turn them to chrome. They only get
 * enough extra reflectivity to respond to the HDR environment.
 */
const RAILING_MATERIALS = new Set([
  "adskMatCLUB_RAILING",
  "PINE_RAILING",
  "adskMatD__RAILING__WOOD",
  "adskMatG__WOOD_RAILING",
  "adskMatRAILING___CAFE",
  "adskMatRAILING___GADER_01",
  "adskMatRAILING___GADER_002",
  "adskMatRAILING___GADER_03",
]);

const RAILING_TUNING = {
  envMapIntensity: 1.0,
  roughnessScale: 0.7,
  minRoughness: 0.15,
};

/**
 * Rooftop photovoltaic panels.
 *
 * Only ONE material in this model is actually a PV panel: Material__3218, used by
 * the 162 `SOL-D_147` meshes. Verified by decoding its basecolour texture — mean
 * RGB [36, 39, 43], i.e. dark neutral — and by its bounds, Y 20.5..22.7 sitting
 * flat on the roofs, single-sided.
 *
 * TRAP, do not repeat: the node name `Solar_402` is NOT a solar panel. Those 344
 * meshes use M_11___Default, whose texture is mean RGB [95, 132, 78] — green —
 * and which is double-sided. It is rooftop PLANTING. M_11___Default_1 (alpha
 * MASK, green) and M_11d (green) are foliage too, and they span the whole site
 * (X -46..306), not just the roofs. Giving any of them low roughness turns the
 * planting into glossy plastic. Judge these by texture and bounds, never by node
 * name.
 *
 * Tuned as CLEARCOAT over dark cells, which is literally what a PV module is: a
 * clear glass sheet over dark silicon.
 *
 * A high-metalness "dark mirror" does NOT work here, and the arithmetic says why:
 * a metal's reflection is multiplied by its own base colour, and this material's
 * tint is baseColorFactor 0.956 x texture mean 39/255 = 0.147. So even a perfect
 * mirror returns only 14.7% of the sky — 0.262 sky radiance x 0.147 = 0.039, i.e.
 * black. That is why raising metalness never made them reflect.
 *
 * Clearcoat is a separate dielectric lobe that is NOT tinted by baseColor. It
 * gives an untinted sky reflection plus a sharp sun glint sitting on top of dark
 * cells — the real appearance of solar glass. clearcoatRoughness is kept very low
 * because the glass sheet is smooth, while the cells underneath stay matte.
 */
const PV_PANEL_MATERIALS = new Set(["Material__3218"]);

const PV_PANEL_TUNING = {
  // The cells: dark, largely diffuse.
  metalness: 0.25,
  roughness: 0.35,
  // The glass sheet: untinted, smooth, and what you actually see reflecting.
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.8,
};

/**
 * Material__3218 declares no glTF material extensions, so GLTFLoader builds a
 * plain MeshStandardMaterial — which has no clearcoat lobe at all. Assigning
 * `clearcoat` to it would be silently ignored, so the panel has to be rebuilt as
 * a MeshPhysicalMaterial.
 *
 * Its metallicRoughnessTexture is carried over: it modulates the cells per-pixel,
 * and dropping it would flatten the panel. clearcoatRoughness is a separate
 * channel, so the glass reflection stays sharp regardless of that map.
 */
const createPvPanelMaterial = (source) => {
  const panel = new THREE.MeshPhysicalMaterial();

  panel.name = source.name;
  if (source.color) panel.color.copy(source.color);
  if (source.normalScale) panel.normalScale.copy(source.normalScale);
  panel.map = source.map ?? null;
  panel.normalMap = source.normalMap ?? null;
  panel.metalnessMap = source.metalnessMap ?? null;
  panel.roughnessMap = source.roughnessMap ?? null;
  panel.side = source.side;

  Object.assign(panel, PV_PANEL_TUNING);
  panel.needsUpdate = true;

  return panel;
};

/**
 * Balcony joinery on the building facades — the surfaces marked in the reference
 * screenshot as needing to pick up the HDR environment.
 *
 * Both were authored without a `roughnessFactor`, and the glTF default is 1.0 —
 * fully matte — so neither could show any environment reflection at all.
 * RooDooR_glTF is additionally metalness 0.80, which at roughness 1.0 makes it a
 * rough metal: no diffuse term, so it rendered dark rather than like a door.
 *
 * Tuned to satin rather than glossy: these are wood and painted joinery, so they
 * should catch a soft sheen of sky, not mirror it.
 */
const FACADE_JOINERY_TUNING = {
  // Balcony shade slats — 22,884 tris spanning y 6..22 across the facades.
  adskMatA__SHADE_WOOD_RAIL: {
    roughness: 0.45,
    metalness: 0.0,
    envMapIntensity: 1.3,
  },
  // Balcony/terrace doors — 85,312 tris spanning y 2..22.
  RooDooR_glTF: { roughness: 0.35, metalness: 0.3, envMapIntensity: 1.3 },
};

/**
 * Roof surfaces that cannot reflect anything as authored.
 *
 * All 21 of these omit `roughnessFactor` in the glTF, and the spec default is
 * 1.0 — fully matte. That is why the roofs never picked up the sky. Clamped to a
 * mid roughness so they catch a soft sheen without becoming glossy.
 */
const ROOF_MATERIALS = new Set([
  "adskMatD___ROOF_BELT",
  "adskMatD__ROOF_TIKRA",
  "Stone_roof",
  "adskMatD__ROOF_SHADE",
  "adskMatRoof_OutLine",
  "adskMatE__FL_ROOF",
  "Stairs_ROOF_glTF",
  "Stone_roof01",
  "adskMatG__BELT_ROOF",
  "G__ROOF_LEFT",
  "adskMatG__ROOF_RIGHT",
  "G__FL_ROOF",
  "adskMatA__ROOF_BONG_01",
  "adskMatA__ROOF_SHADE",
  "A_ROOF_BOON_CENTER",
  "adskMatA__ROOF_SILING",
  "adskMatA__SILING_01",
  "adskMatA__SILING_02",
  "adskMatA__SILING_03",
  "adskMatA__ROOF_FLOOR",
  "adskMatA__SILING_04",
]);

// 0.70, not 0.55. Roof decks are horizontal, so from an aerial view they mirror
// the brightest part of the sky straight back at the camera. At 0.55 the specular
// lobe was wide enough to push those decks to near-white. 0.70 keeps a hint of
// sky sheen — the point of clamping them off the glTF default of 1.0 — without
// letting them blow out.
const ROOF_ROUGHNESS = 0.7;

/**
 * These omit BOTH factors, so they load as metalness 1.0 + roughness 1.0 — a
 * rough metal, which has no diffuse term and renders nearly black under IBL.
 * Almost certainly an export accident rather than an authoring choice.
 */
const NEAR_BLACK_MATERIALS = new Set(["Stairs_ROOF_glTF", "fallback Material"]);

// Terrain and hardscape read as wet mirrors under a bright IBL unless clamped
// matte. All of these names exist in the model.
const GROUND_NAME_RE =
  /500m_plane|ground|earth|gravel|sand|crossing_path|side_road|shvil/i;

/**
 * Builds a fresh MeshPhysicalMaterial for a glazing material.
 *
 * Fresh rather than cloned on purpose: KHR_materials_transmission gives
 * GLASS/Win_Glass/Material__2556 a transmission of 1.0, and three.js answers any
 * transmission > 0 with a full extra render of the scene into a transmission
 * target every frame. A new instance defaults transmission to 0.
 */
const createGlazingMaterial = (source) => {
  const tuned = new THREE.MeshPhysicalMaterial();

  tuned.name = source.name;
  if (source.color) tuned.color.copy(source.color);
  if (source.emissive) tuned.emissive.copy(source.emissive);
  if (source.normalScale) tuned.normalScale.copy(source.normalScale);
  // WIN_GRASS carries both a basecolour and a normal map — keep them.
  tuned.map = source.map ?? null;
  tuned.normalMap = source.normalMap ?? null;
  tuned.side = source.side;
  tuned.depthWrite = source.depthWrite;

  Object.assign(tuned, GLAZING_TUNING);
  tuned.transparent = true;
  tuned.needsUpdate = true;

  return tuned;
};

/**
 * Zeroes transmission on a non-glazing material.
 *
 * The transmission pass is all-or-nothing, so the ten non-glazing transmissive
 * materials (POOL_WATER, Water, Air, Gray_BUILD, the Mercedes glazing, ...) have
 * to be handled too. Ones that were mostly transmissive fall back to plain alpha
 * blending so they still read as see-through.
 */
const stripTransmission = (material) => {
  if (!material.transmission) return false;

  const original = material.transmission;
  material.transmission = 0;

  if (original >= 0.5) {
    material.transparent = true;
    material.opacity = 0.5;
  }

  material.needsUpdate = true;
  return true;
};

export const useHomeScene = () => {
  const { scene } = useGLTF(HOME_MODEL_PATH, true, true, configureLoader);
  const gl = useThree((state) => state.gl);

  const tunedScene = useMemo(() => {
    if (scene.userData[TUNED_FLAG]) return scene;

    // Sharing one tuned instance across every mesh that referenced the same
    // source material keeps the material count (and uniform uploads) down.
    const glazingCache = new Map();
    const pvPanelCache = new Map();
    const litCache = new Map();
    const handled = new Set();
    const maxAnisotropy = gl?.capabilities?.getMaxAnisotropy?.() ?? 1;
    const anisotropy = Math.min(4, maxAnisotropy);
    const stats = {
      glazing: 0,
      railing: 0,
      pvPanel: 0,
      joinery: 0,
      roof: 0,
      unlit: 0,
      nearBlack: 0,
      ground: 0,
      transmission: 0,
      meshes: 0,
    };

    scene.traverse((child) => {
      // No shadow map is configured on this Canvas, so these flags would only
      // add traversal cost in the renderer.
      child.castShadow = false;
      child.receiveShadow = false;

      // The whole masterplan is static — never recompose local matrices.
      // frustumCulled is deliberately left at its default (true).
      child.matrixAutoUpdate = false;

      if (!child.isMesh && !child.isInstancedMesh) return;
      stats.meshes += 1;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material, index) => {
        if (!material) return;

        const assign = (next) => {
          if (Array.isArray(child.material)) child.material[index] = next;
          else child.material = next;
        };

        // The three branches below REPLACE the material rather than mutating it,
        // so they must run for every mesh — they sit above the `handled` guard
        // and use a cache keyed on the source material instead.
        if (GLAZING_MATERIALS.has(material.name)) {
          let tuned = glazingCache.get(material.uuid);
          if (!tuned) {
            tuned = createGlazingMaterial(material);
            glazingCache.set(material.uuid, tuned);
            stats.glazing += 1;
          }
          assign(tuned);
          return;
        }

        if (PV_PANEL_MATERIALS.has(material.name)) {
          let panel = pvPanelCache.get(material.uuid);
          if (!panel) {
            panel = createPvPanelMaterial(material);
            pvPanelCache.set(material.uuid, panel);
            stats.pvPanel += 1;
          }
          assign(panel);
          return;
        }

        // KHR_materials_unlit loads as MeshBasicMaterial, which ignores lights,
        // the environment map, roughness and metalness entirely — it can never
        // respond to sunlight however the scene is lit. adskMatA__SILING_02 is
        // the only material in the model flagged unlit, and it is a roof soffit,
        // so it rendered as a flat patch amid lit surfaces.
        if (material.isMeshBasicMaterial) {
          let lit = litCache.get(material.uuid);
          if (!lit) {
            lit = new THREE.MeshStandardMaterial({
              name: material.name,
              color: material.color,
              map: material.map ?? null,
              transparent: material.transparent,
              opacity: material.opacity,
              side: material.side,
              alphaTest: material.alphaTest,
              roughness: ROOF_ROUGHNESS,
              metalness: 0,
            });
            litCache.set(material.uuid, lit);
            stats.unlit += 1;
          }
          assign(lit);
          return;
        }

        // Materials are shared between meshes; only mutate each one once.
        if (handled.has(material.uuid)) return;
        handled.add(material.uuid);

        if (material.map) material.map.anisotropy = anisotropy;

        if (stripTransmission(material)) stats.transmission += 1;

        // Rooftop PV glass. Checked before the roof clamp because
        // Material__3218's roughness is already fine and only its metalness
        // needs pulling back.
        // Balcony slats and doors. Checked before the roof clamp so their own
        // tuning wins over the generic roof roughness.
        const joinery = FACADE_JOINERY_TUNING[material.name];
        if (joinery) {
          Object.assign(material, joinery);
          material.needsUpdate = true;
          stats.joinery += 1;
          return;
        }

        if (RAILING_MATERIALS.has(material.name)) {
          material.envMapIntensity = RAILING_TUNING.envMapIntensity;
          material.roughness = Math.max(
            RAILING_TUNING.minRoughness,
            (material.roughness ?? 1) * RAILING_TUNING.roughnessScale,
          );
          material.needsUpdate = true;
          stats.railing += 1;
          return;
        }

        if (ROOF_MATERIALS.has(material.name)) {
          // Only clamp down — never make an already-glossy roof rougher.
          material.roughness = Math.min(material.roughness ?? 1, ROOF_ROUGHNESS);
          if (NEAR_BLACK_MATERIALS.has(material.name)) material.metalness = 0;
          material.needsUpdate = true;
          stats.roof += 1;
          return;
        }

        // Catches the remaining "fallback Material" instances, which are not in
        // the roof family but load as metalness 1.0 + roughness 1.0 all the same.
        if (
          NEAR_BLACK_MATERIALS.has(material.name) &&
          material.metalness === 1 &&
          material.roughness === 1
        ) {
          material.metalness = 0;
          material.needsUpdate = true;
          stats.nearBlack += 1;
          return;
        }

        if (GROUND_NAME_RE.test(material.name ?? "")) {
          material.roughness = 1.0;
          material.metalness = 0.0;
          material.needsUpdate = true;
          stats.ground += 1;
        }
      });
    });

    // One forced world-matrix pass, then opt the subtree out of the renderer's
    // per-frame walk. Nothing in this scene ever moves.
    scene.updateMatrixWorld(true);
    scene.matrixWorldAutoUpdate = false;

    scene.userData[TUNED_FLAG] = true;
    logger.info("[useHomeScene] Materials tuned", stats);
    logger.info("[useHomeScene] Glazing materials created", {
      count: glazingCache.size,
      names: [...glazingCache.values()].map((m) => m.name),
      type: [...glazingCache.values()].map((m) => m.type),
    });

    return scene;
  }, [scene, gl]);

  return { scene: tunedScene };
};

export default useHomeScene;
