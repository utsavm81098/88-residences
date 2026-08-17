import * as THREE from "three";
import { ICONS } from "@/assets/icons";

export const DASHBOARD_PREFIX = "dashboard";
export const WEBSITE_URL = "https://www.88residences.com";
const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

export const getAssetPath = (path) => `${BASE_URL}${path}`;

/**
 * Desktop navigation rail widths, in px.
 *
 * The rail itself is `position: absolute` (containers/sidebar-nav/index.jsx), so
 * it reserves no layout space of its own — layouts/main-layout must reserve a
 * matching width or the opaque white rail paints over the page content. Home
 * keeps the rail permanently expanded; inventory keeps it collapsed and expands
 * on hover, where the overhang lands on the 380px filter panel rather than on
 * the 3D canvas.
 */
export const SIDEBAR_WIDTH = {
  collapsed: 55,
  expanded: 225,
};

export const statusType = {
  SOLD: "sold",
  AVAILABLE: "available",
};

export const Preset = {
  ASSET_GENERATOR: "asset-generator",
};

export const UNIT_COLORS = {
  available: {
    base: "#4E8AEB",
    hover: "#1F5ED4",
    selected: "#1245AD",
  },
  sold: {
    base: "#E04F68",
    hover: "#C41832",
    selected: "#8B1022",
  },
};
export const OUTLINE_KEY = "__edgeLines";

export const STATUS_CONFIG = {
  available: { label: "available" },
  sold: { label: "sold" },
  reserved: { label: "reserved" },
};

export const ICON_PROPS_DEFAULT = { size: 20, strokeWidth: 1.8 };

export const UNIT_ICONS = {
  aptType: ICONS.AptType,
  bedrooms: ICONS.Bedrooms,
  area: ICONS.Area,
  balcony: ICONS.Balcony,
  type: ICONS.Type,
  price: ICONS.Price,
  direction: ICONS.Compass,
};

export const NAV_ITEMS = [
  { id: "home", label: "home", icon: ICONS.Home },
  { id: "inventory", label: "inventory", icon: ICONS.Package },
];

export const NAV_ITEMS_MOBILE = [
  { id: "home", label: "home", icon: ICONS.Home },
  { id: "inventory", label: "inventory", icon: ICONS.Package },
  { id: "more", label: "more", icon: ICONS.Menu },
];

export const FILTER_OPTIONS = {
  rooms: ["1", "2", "3", "studio"],
  direction: ["front", "rear", "side"],
  priceRange: { min: 140000, max: 350000 },
  areaRange: { min: 35, max: 105 },
};

// ── Ground ─────────────────────────────────────────────────────────────────────
export const GROUND_CONFIG = {
  size: 1200, // must exceed 2 * fadeDistance so the plane edge is never reachable
  floorColor: "#859d5b",
  cellColor: "#3f8f52",
  sectionColor: "#276b36",
  cellSize: 2,
  sectionSize: 10,
  cellThickness: 0,
  sectionThickness: 1.25,
  fadeDistance: 250,
  lodStart: 0.05,
  lodEnd: 0.45,
};

export const EXPOSURE = 0.0;
// export const EXPOSURE = 1;

export const CANVAS_GL_CONFIG = {
  antialias: true,
  toneMapping: THREE.LinearToneMapping,
  toneMappingExposure: Math.pow(2, EXPOSURE),
  powerPreference: "high-performance",
  outputColorSpace: THREE.SRGBColorSpace,
};

// HOME_GL_CONFIG was removed — it had two conflicting `antialias` keys and was
// never actually used. The live canvas uses getHomeGlConfig() below.

// ── Home masterplan scene ──────────────────────────────────────────────────────
// No `optimize:model` npm script actually exists in this repo, and the
// file's structure didn't match this comment's original join/instance
// claims either — both since fixed. History:
//
// 1. Texture fix: the single 5504x3072 "dji_80m_flip_copy.png" background
//    dome photo (the model's PANO_Sphere backdrop) was resized to 4096x2288
//    and re-encoded to KTX2/ETC1S (qlevel 200) — verified via matched-FOV
//    crop comparisons (not just eyeballing the full panorama) that this is
//    visually indistinguishable from the original at the ~35-50° FOV this
//    camera actually renders; 2048px and even 3584px were visibly softer
//    under the same test and rejected. Every other image at the time was
//    byte-for-byte untouched.
//
// 2. Geometry fix: measured live on real hardware (an Intel HD Graphics 530
//    — a weak integrated GPU, confirmed via chrome://gpu that acceleration
//    itself was working) by patching WebGL2RenderingContext.prototype.
//    drawElements/drawArrays to count real per-frame calls: ~8,400 draw
//    calls/frame. The file had 7,398 nodes for only 608 unique meshes/747
//    primitives — repeated objects (rooftop solar panels, decorative props,
//    etc.) were each a separate un-instanced node, so the true per-frame
//    draw count tracked the 7,398 node count, not the 747 primitive count.
//    Ran @gltf-transform/functions' instance({min:5}) (GPU instancing via
//    EXT_mesh_gpu_instancing, not full geometry joining — doesn't touch
//    material data or rename anything): 7,398 → 1,827 nodes, 103 instanced
//    batches covering 2,837 individual instances. Verified before applying:
//    textures/materials/primitives/scenes/animations/skins counts all
//    exactly unchanged; every material name this codebase's runtime
//    name-based lookups depend on (use-home-scene.js, environment-setup.jsx)
//    still present. instance() DOES strip node names from the batches it
//    creates, which broke two of those lookups
//    (SOLAR_PANEL_NODE_RE/MANGO_TREE_NODE_RE, both node-name-based) —
//    fixed by switching those two specifically to exact material-name
//    matching instead (SOLAR_PANEL_MATERIAL_NAMES/MANGO_TREE_MATERIAL_NAMES
//    in use-home-scene.js), verified each set of materials is used
//    exclusively by the nodes the old pattern targeted. The remaining
//    node-name-based lookups (RAILING_NODE_RE, GLASS_NODE_EXCLUSION_RE)
//    were verified empirically unaffected — those specific nodes didn't
//    qualify for instancing (distinct geometry per node, or below the
//    min:5 threshold), not because they're inherently safe from a future
//    re-run of this same instancing pass.
//
// Original (pre-instancing, post-texture-fix) file backed up outside the
// repo, not committed alongside this change; ask before assuming a
// replacement exists if this needs reverting.
export const HOME_MODEL_PATH = getAssetPath("/models/88RES-06_05-2.glb");
// This panorama is used for image-based lighting only. The model owns the
// visible panorama sphere, so it is never used as a flat background.
export const HOME_ENV_PATH = getAssetPath("/hdr/80m-nano-green.jpg");

/**
 * Bounding box of all 436 meshes using a glass material. Windows exist only on
 * the seven buildings, so this IS the building envelope — measured by parsing
 * the GLB, not eyeballed. Size 55.21 x 18.60 x 182.82; the 3.3:1 plan ratio is
 * why framing has to be solved per aspect ratio.
 */
export const BUILDING_BBOX = {
  min: [-36.15, 1.8, -102.72],
  max: [19.06, 20.4, 80.1],
};

/**
 * Camera + orbit limits for the home masterplan scene.
 *
 * `target` is the measured centre of the seven buildings: the bounding box of
 * all 436 meshes using a glass material (windows only exist on the buildings)
 * spans X -36.15..19.06, Y 1.80..20.40, Z -102.72..80.10, so its midpoint is
 * [-8.5, 11.1, -11.3]. Orbiting about that point gives an equally well-framed
 * view from every azimuth.
 *
 * The camera is described by ANGLES, not a fixed position. The direction comes
 * from the gltfeditor reference render: the offset tuned on
 * features/big-scene-version-1 (camera [-173,53,-88] about target [-5,20,-7]) is
 * [-168, 33, -81] → azimuth -115.73°, elevation 10.03°.
 *
 * The DISTANCE is solved at runtime from the live canvas aspect by
 * features/home-scene/fit-camera.js, because no single value works everywhere:
 * a portrait phone needs ~484 units where a 1920x950 desktop needs ~192. The
 * reference render's own 189.4 clips the outer buildings on anything narrower
 * than about 2:1. Zoom limits are scales of that fitted distance so they mean
 * the same thing on every device.
 */
export const HOME_CAMERA = {
  target: [-8.5, 11.1, -11.3],
  azimuthDeg: -115.73,
  // 22° elevation matches the reference screenshot — camera is near-horizon,
  // building facades dominate (not rooftops), sea visible at top of frame.
  elevationDeg: 10,
  bbox: BUILDING_BBOX,

  baseFov: 35,
  baseAspect: 1.6,
  // 50° rather than 60°: portrait phones would otherwise need a fish-eye FOV to
  // hold the long axis. Past this point extra distance is the better lever.
  maxFov: 50,
  margin: 1.06,

  // The model's own PANO_Sphere dome has a radius of ~670 units, so the far
  // The dome needs a 1290-unit view distance at the outer orbit limit. A 2/1400
  // clip range is tight enough to preserve depth precision for the context
  // layers while remaining comfortably clear of the nearest orbitable surface.
  near: 2,
  far: 1400,

  minDistanceScale: 0.6,
  maxDistanceScale: 1.1,
  // Hard ceiling: keeps the camera well inside the PANO_Sphere dome radius.
  // Same scale factors and cap are used on every device — mobile/tablet
  // pinch-zoom range now matches desktop exactly.
  maxDistanceCap: 400,

  mobileMargin: 0.5, // Tighter framing on mobile (crops sides to zoom closer to the center)
  mobileMaxFov: 55, // Slightly wider FOV limit on mobile to allow getting closer without fish-eye

  // Opening at 30° elevation (polar 60°) — moderate aerial view matching the reference
  // image. Shows rooftops + facades with a gentle diagonal (not steep top-down).
  // The building cluster's 180-unit Z span creates less vertical screen displacement
  // at 30° than at 45° (tan 30° = 0.577 vs tan 45° = 1.0), giving a balanced frame.
  // Orbit range: minPolar 35° (55° elevation max) ↔ maxPolar 72° (18° min elevation).
  // maxPolarDeg reduced from 85° → 72° to prevent the camera from dropping close
  // enough to ground level that the surface plane dominates the view.
  minPolarDeg: 35,
  maxPolarDeg: 82,
};

/**
 * Property/plot-boundary rectangle the orbit target is clamped to during
 * desktop pan — matches the 4-sided red rectangle drawn around the 7
 * buildings in the reference render. Pan is free anywhere inside this box,
 * including close on a single building with the others partly or fully
 * off-screen; only crossing the line itself is disallowed.
 *
 * minX/maxX and minY/maxY are hand-tuned from live testing — left as-is.
 *
 * maxZ was 92 (103.3 units from the [-8.5, 11.1, -11.3] target/centroid),
 * visibly too far live: swiping toward building A revealed open field well
 * past the plot line before hitting the limit (see reference screenshot with
 * the hand-drawn red line ~2.5 building-gaps beyond A). minZ's -55 (43.7
 * units from centroid) was NOT flagged as a problem, so maxZ is mirrored to
 * that same 43.7-unit distance instead of picking an unrelated number —
 * keeps Z symmetric around the centroid using the side that's already
 * confirmed to look right. Re-verify live and adjust if still off.
 */
export const HOME_PAN_BOUNDARY = {
  minX: -10,
  maxX: -5,
  minZ: -55,
  maxZ: 32,
  // Y: keeps the orbit target within the building height band (bbox
  // 1.8..20.4), inset slightly so a tilted pan can't drag the pivot through
  // the roofline or below grade.
  minY: 5,
  maxY: 16,

  // Mobile/tablet overrides — the desktop box above felt too tight around the
  // 7-building cluster on a two-finger touch pan (X in particular is only 5
  // units wide), so every axis gets a moderate ~50-60% wider box on small
  // viewports, centered on the same midpoints as the desktop box. X gets the
  // biggest relative increase since it was the tightest and the one flagged
  // live; Z/Y are widened proportionally less since they already had more
  // room. Re-verify live and adjust if still off.
  mobileMinX: -11.5,
  mobileMaxX: -3.5,
  mobileMinZ: -65,
  mobileMaxZ: 42,
  mobileMinY: 3,
  mobileMaxY: 18,
};

/**
 * Renderer config for the home canvas.
 *
 * Hardware MSAA (antialias: !isMobile) provides crisp native anti-aliasing for architectural
 * geometry and works with Alpha-to-Coverage to anti-alias foliage cutout edges natively without
 * any post-processing blur.
 */
export const HOME_EXPOSURE = 0.0;

export const getHomeGlConfig = (_isMobile) => ({
  // Native hardware MSAA (antialias: true) is required for alphaToCoverage
  // to function on the leaf-cutout foliage materials (use-home-scene.js's
  // isLeafCutout branch). alphaToCoverage converts continuous alpha values
  // into MSAA coverage masks, producing smooth, sub-pixel leaf edges during
  // camera orbit. With antialias: false the canvas has 1 sample — alphaToCoverage
  // degrades to binary clip, which is exactly the per-frame shimmer/noise
  // visible on trees as the camera rotates.
  //
  // Previous history: antialias was set to false because the combination of
  // native MSAA + EffectComposer multisampling={8} + DESKTOP_DPR_FLOOR=2 ran
  // the scene at 0–4 FPS on real hardware. All three of those extra costs are
  // now gone: EffectComposer/FXAA has been removed (native MSAA makes it
  // redundant), DESKTOP_DPR_FLOOR is 1, and DPR is never forced above the
  // display's native value. Native 4× MSAA alone is well within budget.
  antialias: true,
  toneMapping: THREE.NeutralToneMapping,
  toneMappingExposure: Math.pow(2, HOME_EXPOSURE),
  powerPreference: "high-performance",
  outputColorSpace: THREE.SRGBColorSpace,
});

// Desktop dpr floor. Previously forced to 2 (real supersampling for
// alpha-cutout foliage edges, rather than relying on whatever DPR the
// display happens to report) — reverted to 1 after live measurement on real
// hardware (production build, GPU hardware acceleration confirmed via
// chrome://gpu) showed the combination of that 2x floor with the old
// <EffectComposer multisampling={8}> in home-scene/index.jsx ran the Home
// scene at 0-4 FPS. Flooring at 1 (native resolution, no forced
// supersampling) combined with switching to native antialias (see
// getHomeGlConfig above) brought real, measured FPS back into a usable
// range. If a future GPU/perf budget allows revisiting supersampling, treat
// it as a deliberate quality trade-off to re-measure live, not a default to
// restore blindly — this exact combination is what caused the regression.
const DESKTOP_DPR_FLOOR = 1;

/** Device-tiered device-pixel-ratio clamp for the home canvas. */
export const getHomeDpr = (isMobile) => {
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  return isMobile ? Math.min(dpr, 1.5) : Math.min(Math.max(dpr, 1), 2);
};

// Matches hooks/use-mobile.js's MOBILE_BREAKPOINT. Not imported from there:
// utils/ sits below hooks/ in this project's layering (see
// .agents/rules/architecture.md), so the literal is duplicated rather than
// creating a reverse dependency.
const DEVICE_TIER_MOBILE_BREAKPOINT = 1024;

// Known weak/integrated GPU families, matched against
// WEBGL_debug_renderer_info's UNMASKED_RENDERER_WEBGL string. Added after a
// real report on real hardware: an 8-core/16GB desktop with an Intel HD
// Graphics 530 (a 2015-era integrated GPU) rendered the Home scene at 0-4
// FPS, but getDeviceTier()'s CPU-core/RAM-only heuristic classified it as
// "high" tier — cores and RAM say nothing about GPU throughput, which is
// what actually gates a WebGL-heavy scene like this one. "HD Graphics" and
// "UHD Graphics" (without Iris/Arc, Intel's more capable integrated/discrete
// lines) cover Intel's budget/older integrated chips specifically; software
// rendering fallbacks (should already be rare — chrome://gpu normally shows
// hardware acceleration is available) are covered too, defensively.
const isWeakGpuRenderer = (rendererString) => {
  if (!rendererString) return false;
  const s = rendererString.toLowerCase();
  if (s.includes("swiftshader") || s.includes("software rasterizer")) {
    return true;
  }
  // Intel's more capable integrated/discrete lines — never flag these even
  // though some also contain "graphics".
  if (s.includes("iris") || s.includes("arc")) return false;
  return s.includes("hd graphics") || s.includes("uhd graphics");
};

const getGpuRendererString = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
  } catch {
    return null;
  }
};

/**
 * Coarse, one-time device-capability tier — used to bias how much of each
 * KTX2 texture's embedded mip chain gets uploaded to the GPU (see
 * TEXTURE_MIP_BIAS and the texture-tuning loop in
 * features/home-scene/use-home-scene.js).
 *
 * Deliberately a plain function meant to be called ONCE per model load, not
 * a reactive hook: mip levels dropped via this bias are sliced out of the
 * texture's `.mipmaps` array and discarded — there is no cheap way to "add
 * resolution back" if the tier were recomputed mid-session. Same reasoning
 * that already ruled out AdaptiveDpr/PerformanceMonitor for this scene (see
 * the comment in features/home-scene/index.jsx).
 *
 * navigator.deviceMemory is Chromium-only; every signal degrades to an
 * optimistic default (assume capable) rather than assuming a low tier on
 * browsers that don't expose it. The GPU renderer-string check similarly
 * degrades to "not weak" if WEBGL_debug_renderer_info isn't available
 * (some browsers restrict it) — an unknown GPU is treated as capable rather
 * than guessed at.
 *
 * - "high": capable of the full authored texture resolution — a typical desktop.
 * - "mid": a capable device on a small/touch viewport, or a desktop reporting
 *   unusually few cores/memory or a known-weak GPU.
 * - "low": mobile/tablet AND reporting few CPU cores, little device memory,
 *   or a known-weak GPU — the profile this needs to protect VRAM/upload
 *   time on.
 */
export const getDeviceTier = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "high";
  }

  const isMobileViewport = window.innerWidth < DEVICE_TIER_MOBILE_BREAKPOINT;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memoryGB = navigator.deviceMemory ?? 8;
  const gpuRenderer = getGpuRendererString();
  const constrained =
    cores <= 4 || memoryGB <= 4 || isWeakGpuRenderer(gpuRenderer);

  if (!isMobileViewport) return constrained ? "mid" : "high";
  return constrained ? "low" : "mid";
};

const typeAConfig = {
  model: getAssetPath("/models/type-a-1024.glb"),
  hitbox: getAssetPath("/models/a-hitbox.glb"),
  heroAngle: 0,
  environment: {
    files: getAssetPath("/hdr/sky-40m-compressed.exr"),
    background: false,
    rotation: [0, 0, 0],
    backgroundRotation: [0, 0, 0],
    intensity: 1.0,
    resolution: 2048,
  },
  lighting: {
    // Match reference viewer: camera-attached lights at ~60° angle
    directIntensity: 0.03,
    directColor: "#ffffff",
    ambientIntensity: 1.35,
    ambientColor: "#ffffff",
    punctualLights: true,
    exposure: 0.0, // No tone mapping boost (Math.pow(2,0)=1.0)
    toneMapping: THREE.ACESFilmicToneMapping,
  },
};

export const BUILDING_CONFIG = [
  {
    name: "A",
    ...typeAConfig,
  },
  {
    name: "B",
    ...typeAConfig,
    hitbox: getAssetPath("/models/b-hitbox.glb"),
  },
  {
    name: "C",
    ...typeAConfig,
    hitbox: getAssetPath("/models/c-hitbox.glb"),
  },
  {
    name: "D",
    ...typeAConfig,
    model: getAssetPath("/models/type-d-final.glb"),
    hitbox: getAssetPath("/models/d-hitbox.glb"),
  },
  {
    name: "E",
    ...typeAConfig,
    model: getAssetPath("/models/type-f-1024.glb"),
    hitbox: getAssetPath("/models/e-hitbox.glb"),
  },
  {
    name: "F",
    ...typeAConfig,
    model: getAssetPath("/models/type-f-1024.glb"),
    hitbox: getAssetPath("/models/f-hitbox.glb"),
  },
  {
    name: "G",
    ...typeAConfig,
    model: getAssetPath("/models/type-g.glb"),
    hitbox: getAssetPath("/models/g-hitbox.glb"),
  },
];

export const DEFAULT_STALE_TIME = 1000 * 60 * 5;
