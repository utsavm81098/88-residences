import * as THREE from "three";
import { ICONS } from "@/assets/icons";

export const DASHBOARD_PREFIX = "dashboard";
export const WEBSITE_URL = "https://www.88residences.com";
const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

export const getAssetPath = (path) => `${BASE_URL}${path}`;

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

// ── Grid ───────────────────────────────────────────────────────────────────────
export const GRID_CONFIG = {
  position: [0, 0.02, 0],
  args: [100, 100],
  cellSize: 2,
  cellThickness: 0.6,
  cellColor: "#1a1510",
  sectionSize: 10,
  sectionThickness: 0.6,
  sectionColor: "#d4af37",
  fadeDistance: 180,
  fadeStrength: 1.2,
  followCamera: false,
  infiniteGrid: true,
  renderOrder: 1,
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
