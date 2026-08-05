import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { configureLoader } from "@/utils/preloader";
import { HOME_MODEL_PATH } from "@/utils/constant";
import { logger } from "@/utils/logger";

const TUNED_FLAG = "__homeSceneArchitectureTuned";

// Exact matches prevent real grass (for example, WIN_GRASS is an export typo for
// window glass) from being mistaken for foliage or reflective glass.
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

// Both already load as roughness 0.1 / metalness 0 MeshPhysicalMaterial, close
// enough to a mirror that they mostly show the PMREM environment reflection
// rather than their own pale-blue colour. The environment's zenith is deep
// navy (see EnvironmentSetup), so from most orbit angles that reads as the
// pool going black, only flashing blue when the camera catches the sun's
// specular glint directly. Same class of "too mirror-like under a dark-zenith
// environment" problem already solved below for roofs and railings.
const WATER_MATERIALS = new Set(["POOL_WATER", "Water"]);

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
  "G__ROOF_RIGHT",
  "G__FL_ROOF",
  "adskMatA__ROOF_BONG_01",
  "adskMatA__ROOF_SHADE",
  "A_ROOF_BOON_CENTER",
  "adskMatA__ROOF_SILING",
  "adskMatA__SILING_01",
  "adskMatA__SILING_02",
  "adskMatA__SILING_03",
  "adskMatA__ROOF_FLOOR",
]);

const FOLIAGE_NAME_RE = /tree|bush|leaf|palm|mango|oak|birch|lemon|plant/i;
const LANDSCAPE_NAME_RE = /grass|earth|ground|road|path|sand|gravel|terrain|off_road/i;
const ROAD_SURFACE_RE = /road|path|crossing|shvil/i;
// GLTFLoader sanitizes node names by replacing whitespace with underscores
// (three.js PropertyBinding.sanitizeNodeName), so a glTF node authored as
// "Plane002 NeWwW" or "Line019 Build003" is exposed here as "Plane002_NeWwW" /
// "Line019_Build003". Match both forms so this survives re-exports either way.
const CONTEXT_PLANE_RE = /^plane002[\s_]*newww$/i;
const CONTEXT_BUILDING_RE = /^(build0|off_road|bg_|context_|surround_|line019[\s_]*build)/i;

/**
 * Leaf atlases in the GLB (e.g. BirchBranchAtlas, Material__28, OakBranchAtlas) are 2D alpha cutout billboards.
 * Converting them to MeshStandardMaterial makes flat card geometry evaluate N·L lighting as 0, turning leaves pitch black.
 * Keeping them as MeshBasicMaterial ensures leaf textures render bright, vibrant, and unlit as intended.
 */
const createFoliageMaterial = (source) => {
  const foliage = new THREE.MeshBasicMaterial({
    name: source.name,
    color: new THREE.Color("#ffffff"),
    map: source.map ?? null,
    alphaMap: source.alphaMap ?? null,
    transparent: source.transparent ?? true,
    opacity: source.opacity ?? 1,
    alphaTest: source.alphaTest || 0.4,
    side: THREE.DoubleSide,
    depthWrite: true,
    // Tree bases sit at the same Y as the grass/ground they're planted in, so
    // their card geometry is coplanar with the landscape surface (offset -1,
    // see getContextDepthLayer) at the trunk. This branch replaces the
    // material before that per-surface depth-layer logic ever runs, so
    // foliage needs its own fixed offset here instead: more negative than
    // landscape's -1 so trees reliably win the depth test and don't flicker
    // against the ground while orbiting.
    polygonOffset: true,
    polygonOffsetFactor: -1.2,
    polygonOffsetUnits: -1.2,
  });

  foliage.needsUpdate = true;

  return foliage;
};

/**
 * Rebuilds imported transmissive glazing as lightweight architectural glass.
 * This avoids the expensive full-scene transmission pass while retaining a
 * stable, softly reflective facade at every camera angle.
 */
const createGlazingMaterial = (source) => {
  const glass = new THREE.MeshPhysicalMaterial({
    name: source.name,
    transparent: true,
    opacity: 0.85,
    side: source.side,
    depthWrite: source.depthWrite,
    metalness: 0.2,
    roughness: 0.06,
    ior: 1.5,
    envMapIntensity: 1.8,
    clearcoat: 0.5,
    clearcoatRoughness: 0.05,
    reflectivity: 0.9,
    transmission: 0,
  });

  if (source.color) glass.color.copy(source.color);
  if (source.emissive) glass.emissive.copy(source.emissive);
  if (source.map) glass.map = source.map;
  if (source.normalMap) glass.normalMap = source.normalMap;
  if (source.normalScale) glass.normalScale.copy(source.normalScale);
  glass.needsUpdate = true;

  return glass;
};

const createPvPanelMaterial = (source) => {
  const panel = new THREE.MeshPhysicalMaterial({
    name: source.name,
    metalness: 0.2,
    roughness: 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.09,
    envMapIntensity: 0.8,
    side: source.side,
  });

  if (source.color) panel.color.copy(source.color);
  panel.map = source.map ?? null;
  panel.normalMap = source.normalMap ?? null;
  panel.metalnessMap = source.metalnessMap ?? null;
  panel.roughnessMap = source.roughnessMap ?? null;
  if (source.normalScale) panel.normalScale.copy(source.normalScale);
  panel.needsUpdate = true;

  return panel;
};

const setTextureAnisotropy = (material, anisotropy) => {
  [
    material.map,
    material.normalMap,
    material.roughnessMap,
    material.metalnessMap,
    material.alphaMap,
  ].forEach((texture) => {
    if (!texture) return;

    texture.anisotropy = anisotropy;

    // The source GLB marks several large grass/context maps with
    // `LinearFilter`, which disables mipmaps. It looks acceptable in a still
    // close-up but aliases into animated diagonal stripes while orbiting over
    // the site. Restore trilinear mip filtering for stable distant detail.
    if (texture.minFilter === THREE.LinearFilter) {
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
    }

    texture.needsUpdate = true;
  });
};

/**
 * The GLB layers a satellite/context plane underneath grass, roads, and simple
 * white massing buildings. At shallow orbit angles their source polygons are
 * almost coplanar, so the depth buffer alternates between them. Small, ordered
 * polygon offsets retain every layer while making its depth deterministic.
 */
const getContextDepthLayer = ({ childName, materialName }) => {
  const surfaceName = `${childName} ${materialName}`;

  if (ROAD_SURFACE_RE.test(surfaceName)) {
    return { id: "road", factor: -2, units: -2 };
  }

  if (LANDSCAPE_NAME_RE.test(surfaceName)) {
    return { id: "landscape", factor: -1, units: -1 };
  }

  if (
    CONTEXT_BUILDING_RE.test(childName) ||
    materialName === "Gray_BUILD" ||
    materialName === "DefaultMaterial"
  ) {
    return { id: "massing-building", factor: -1.5, units: -1.5 };
  }

  if (CONTEXT_PLANE_RE.test(childName)) {
    return { id: "context-base", factor: 2, units: 2 };
  }

  return null;
};

const createContextDepthMaterial = (source, depthLayer) => {
  const material = source.clone();
  material.polygonOffset = true;
  material.polygonOffsetFactor = depthLayer.factor;
  material.polygonOffsetUnits = depthLayer.units;
  material.needsUpdate = true;
  return material;
};

/** Loads and tunes the static masterplan for daylight architectural rendering. */
export const useHomeScene = () => {
  const { scene } = useGLTF(HOME_MODEL_PATH, true, true, configureLoader);
  const gl = useThree((state) => state.gl);

  const tunedScene = useMemo(() => {
    if (scene.userData[TUNED_FLAG]) return scene;

    const foliageCache = new Map();
    const glazingCache = new Map();
    const panelCache = new Map();
    const contextDepthMaterialCache = new Map();
    const handledMaterials = new Set();
    const anisotropy = Math.min(
      8,
      gl?.capabilities?.getMaxAnisotropy?.() ?? 1,
    );
    const stats = { foliage: 0, glazing: 0, panels: 0, meshes: 0 };

    scene.traverse((child) => {
      child.matrixAutoUpdate = false;
      if (!child.isMesh && !child.isInstancedMesh) return;
      stats.meshes += 1;

      const childName = child.name || "";
      const isPanorama = /pano|sky|dome/i.test(childName);
      const isFoliage = FOLIAGE_NAME_RE.test(childName);
      const isLandscape = LANDSCAPE_NAME_RE.test(childName);
      const isContextPlane = CONTEXT_PLANE_RE.test(childName);
      const rawMaterials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      // Node-name patterns miss a handful of massing pieces (for example
      // Line023-026, and the DefaultMaterial "Plane001"/"Plane002" massing
      // boxes) that don't follow the Line019-Build naming convention at all.
      // Matching on material name too keeps every instance of the same context
      // massing on the same shadow/culling path instead of a few stragglers
      // behaving differently.
      const isBackgroundBuilding =
        CONTEXT_BUILDING_RE.test(childName) ||
        rawMaterials.some(
          (material) =>
            material?.name === "Gray_BUILD" ||
            material?.name === "DefaultMaterial",
        );

      // The panorama, surrounding context, satellite/context ground plane, and
      // hundreds of alpha-cutout leaves do not participate in the shadow pass.
      // Buildings still cast crisp shadows, while this keeps the 110 MB scene
      // responsive during orbiting.
      if (isPanorama || isFoliage || isLandscape || isContextPlane) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.frustumCulled = false;
      } else if (isBackgroundBuilding) {
        child.castShadow = false;
        child.receiveShadow = true;
        child.frustumCulled = false;
      } else {
        child.castShadow = true;
        child.receiveShadow = true;
      }

      const materials = rawMaterials;

      materials.forEach((material, index) => {
        if (!material) return;

        const assignMaterial = (nextMaterial) => {
          if (Array.isArray(child.material)) child.material[index] = nextMaterial;
          else child.material = nextMaterial;
        };

        const isAlphaMaskedUnlitFoliage =
          !isPanorama &&
          (isFoliage || (material.isMeshBasicMaterial && material.alphaTest > 0)) &&
          material.map;

        if (isAlphaMaskedUnlitFoliage) {
          let foliage = foliageCache.get(material.uuid);
          if (!foliage) {
            foliage = createFoliageMaterial(material);
            foliageCache.set(material.uuid, foliage);
            stats.foliage += 1;
          }
          assignMaterial(foliage);
          return;
        }

        if (GLAZING_MATERIALS.has(material.name)) {
          let glass = glazingCache.get(material.uuid);
          if (!glass) {
            glass = createGlazingMaterial(material);
            glazingCache.set(material.uuid, glass);
            stats.glazing += 1;
          }
          assignMaterial(glass);
          return;
        }

        if (material.name === "Material__3218") {
          let panel = panelCache.get(material.uuid);
          if (!panel) {
            panel = createPvPanelMaterial(material);
            panelCache.set(material.uuid, panel);
            stats.panels += 1;
          }
          assignMaterial(panel);
          return;
        }

        if (!handledMaterials.has(material.uuid)) {
          handledMaterials.add(material.uuid);
          setTextureAnisotropy(material, anisotropy);

          // Non-glass transmission creates an extra full-scene render each frame.
          // Preserve its visual translucency with alpha blending instead.
          if (material.transmission > 0) {
            const originalTransmission = material.transmission;
            material.transmission = 0;
            if (originalTransmission >= 0.5) {
              material.transparent = true;
              material.opacity = Math.min(material.opacity, 0.62);
            }
          }

          if (RAILING_MATERIALS.has(material.name)) {
            material.metalness = Math.min(material.metalness ?? 0, 0.15);
            material.roughness = Math.max(material.roughness ?? 1, 0.35);
            material.envMapIntensity = 0.45;
          } else if (ROOF_MATERIALS.has(material.name)) {
            material.metalness = 0;
            material.roughness = Math.max(material.roughness ?? 1, 0.7);
            material.envMapIntensity = 0.35;
          } else if (LANDSCAPE_NAME_RE.test(material.name || "")) {
            material.metalness = 0;
            material.roughness = 1;
            material.envMapIntensity = 0.24;
          } else if (material.name === "Gray_BUILD") {
            material.color = new THREE.Color("#c4ccdf");
            material.metalness = 0;
            material.roughness = 0.82;
            material.envMapIntensity = 0.4;
            material.transparent = false;
            material.opacity = 1.0;
            material.depthWrite = true;
          } else if (WATER_MATERIALS.has(material.name)) {
            material.metalness = 0;
            // Widens the specular lobe so sunlit water reads as a broad sheen
            // visible from more angles, instead of a knife-edge mirror glint.
            material.roughness = Math.max(material.roughness ?? 0, 0.28);
            material.envMapIntensity = 0.5;
          }

          material.needsUpdate = true;
        }

        const depthLayer = getContextDepthLayer({
          childName,
          materialName: material.name || "",
        });
        if (!depthLayer) return;

        // Polygon offset belongs to a material. Clone only these imported
        // context materials so a shared GLB material cannot move an unrelated
        // building, tree, or facade into the same depth layer.
        const cacheKey = `${material.uuid}:${depthLayer.id}`;
        let contextMaterial = contextDepthMaterialCache.get(cacheKey);
        if (!contextMaterial) {
          contextMaterial = createContextDepthMaterial(material, depthLayer);
          contextDepthMaterialCache.set(cacheKey, contextMaterial);
        }
        assignMaterial(contextMaterial);
      });
    });

    scene.updateMatrixWorld(true);
    scene.matrixWorldAutoUpdate = false;
    scene.userData[TUNED_FLAG] = true;
    logger.info("[useHomeScene] Architectural scene tuned", stats);

    return scene;
  }, [gl, scene]);

  return { scene: tunedScene };
};

// Commented out to prevent loading KTX2 textures before WebGL context is initialized and detectSupport is run
// useGLTF.preload(HOME_MODEL_PATH, true, true, configureLoader);

export default useHomeScene;
