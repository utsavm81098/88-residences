import * as THREE from "three";
import { ICONS } from "@/assets/icons";

export const DASHBOARD_PREFIX = "dashboard";
const BASE_URL = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

const getAssetPath = (path) => `${BASE_URL}${path}`;

export const statusType = {
  SOLD: "sold",
  AVAILABLE: "available",
};

export const Preset = {
  ASSET_GENERATOR: "asset-generator",
};

export const UNIT_COLORS = {
  available: {
    base: new THREE.Color("#6B8EB5"),
    hover: new THREE.Color("#51A5F0"),
    selected: new THREE.Color("#3794EB"),
    baseOpacity: 0.1,
    hoverOpacity: 0.6,
    selectedOpacity: 0.8,
  },
  sold: {
    base: new THREE.Color("#F87171"),
    hover: new THREE.Color("#F87171"),
    selected: new THREE.Color("#EF4444"),
    baseOpacity: 0.1,
    hoverOpacity: 0.5,
    selectedOpacity: 0.7,
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
  { id: "inventory", label: "inventory", icon: ICONS.Search },
];

export const NAV_ITEMS_MOBILE = [
  { id: "home", label: "home", icon: ICONS.Home },
  { id: "inventory", label: "inventory", icon: ICONS.Search },
  { id: "more", label: "more", icon: ICONS.Menu },
];

export const FILTER_OPTIONS = {
  rooms: ["1", "2", "3", "studio"],
  direction: ["front", "rear", "side"],
  priceRange: { min: 100000, max: 300000 },
  areaRange: { min: 30, max: 120 },
};

// ── Grid ───────────────────────────────────────────────────────────────────────
export const GRID_CONFIG = {
  position: [0, 0.01, 0],
  args: [100, 100],
  cellSize: 2,
  cellThickness: 0,
  sectionSize: 10,
  sectionThickness: 0.9,
  sectionColor: "#ffffff",
  fadeDistance: 200,
  fadeStrength: 1,
  followCamera: false,
  infiniteGrid: true,
  renderOrder: 1,
};

export const EXPOSURE = -1.4;

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
    files: [
      getAssetPath("/cube-map/py.png"), // Right
      getAssetPath("/cube-map/py.png"), // Left
      getAssetPath("/cube-map/pz.png"), // Top
      getAssetPath("/cube-map/px.png"), // Bottom
      getAssetPath("/cube-map/py.png"), // Back
      getAssetPath("/cube-map/py.png"), // Front
    ],
    background: false,
    rotation: [0, 0, 0],
    backgroundRotation: [0, 0, 0],
    intensity: 2.0,
  },
  lighting: {
    // Match reference viewer (Math.PI * 0.8 ≈ 2.51) to get the bright specular highlight on glass
    directIntensity: 1.5,
    directColor: "#ffffff",
    ambientIntensity: 0.8, // Match ref viewer
    ambientColor: "#ffffff",
    punctualLights: true,
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
