import { ICONS } from "@/assets/icons";
import * as THREE from "three/webgpu";

export const unitData = {
  "Type F": [
    {
      name: "Box001",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$250,000",
      floor: 4,
      direction: "North-East",
    },
    {
      name: "Box002",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Box003",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$350,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Box004",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Box005",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$255,000",
      floor: 4,
      direction: "North-East",
    },
    {
      name: "Box006",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Box007",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Box008",
      status: "sold",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 3,
      direction: "South-East",
    },
    {
      name: "Box009",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$255,000",
      floor: 3,
      direction: "North-East",
    },
    {
      name: "Box010",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Box011",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 2,
      direction: "North-West",
    },
    {
      name: "Box012",
      status: "sold",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 2,
      direction: "South-East",
    },
    {
      name: "Box013",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 2,
      direction: "North-West",
    },
    {
      name: "Box014",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 2,
      direction: "North-West",
    },
    {
      name: "Box015",
      status: "available",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 2,
      direction: "South-East",
    },
    {
      name: "Box016",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 1,
      direction: "North-West",
    },
    {
      name: "Box017",
      status: "available",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 1,
      direction: "South-East",
    },
    {
      name: "Box018",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 1,
      direction: "North-West",
    },
    {
      name: "Box019",
      status: "available",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 1,
      direction: "South-East",
    },
    {
      name: "Box020",
      status: "available",
      type: "3BHK",
      area: "1750 sq ft",
      price: "$550,000",
      floor: 1,
      direction: "South-East",
    },
  ],
  "Type D": [
    {
      name: "Box001",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$250,000",
      floor: 4,
      direction: "North-East",
    },
    {
      name: "Box002",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Box003",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$350,000",
      floor: 4,
      direction: "North-West",
    },
    // {
    //   name: "Box004",
    //   status: "sold",
    //   type: "2BHK",
    //   area: "1050 sq ft",
    //   price: "$355,000",
    //   floor: 4,
    //   direction: "North-West",
    // },
    // {
    //   name: "Box005",
    //   status: "available",
    //   type: "1BHK",
    //   area: "750 sq ft",
    //   price: "$255,000",
    //   floor: 4,
    //   direction: "North-East",
    // },
    // {
    //   name: "Box006",
    //   status: "sold",
    //   type: "2BHK",
    //   area: "1050 sq ft",
    //   price: "$355,000",
    //   floor: 3,
    //   direction: "North-West",
    // },
  ],
  "Type A": [
    {
      name: "Line002",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$250,000",
      floor: 4,
      direction: "North-East",
    },
    {
      name: "Line003",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Line004",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$350,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Line005",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$350,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Line006",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$350,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Line028",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 4,
      direction: "North-West",
    },
    {
      name: "Line027",
      status: "available",
      type: "1BHK",
      area: "750 sq ft",
      price: "$255,000",
      floor: 4,
      direction: "North-East",
    },
    {
      name: "Line024",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line023",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line022",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line021",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line020",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line007",
      status: "sold",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
    {
      name: "Line011",
      status: "available",
      type: "2BHK",
      area: "1050 sq ft",
      price: "$355,000",
      floor: 3,
      direction: "North-West",
    },
  ],
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
    base: new THREE.Color("#6B8EB5"),
    hover: new THREE.Color("#51A5F0"),
    selected: new THREE.Color("#3794EB"),
    baseOpacity: 0.1,
    hoverOpacity: 0.6,
    selectedOpacity: 0.8,
  },
  sold: {
    base: new THREE.Color("#D0D0D0"),
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

export const EXPOSURE = -1.4;

export const CANVAS_GL_CONFIG = {
  antialias: true,
  toneMapping: THREE.LinearToneMapping,
  toneMappingExposure: Math.pow(2, EXPOSURE),
  powerPreference: "high-performance",
  outputColorSpace: THREE.SRGBColorSpace,
};

const typeAConfig = {
  model: "/models/type-a-1024.glb",
  hitbox: "/models/a-hitbox.glb",
  environment: {
    files: [
      "/Standard-Cube-Map/py.png", // Right
      "/Standard-Cube-Map/py.png", // Left
      "/Standard-Cube-Map/pz.png", // Top
      "/Standard-Cube-Map/px.png", // Bottom
      "/Standard-Cube-Map/py.png", // Back
      "/Standard-Cube-Map/py.png", // Front
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
    hitbox: "/models/b-hitbox.glb",
  },
  {
    name: "C",
    ...typeAConfig,
    hitbox: "/models/c-hitbox.glb",
  },
  {
    name: "D",
    ...typeAConfig,
    model: "/models/type-d-1024.glb",
    hitbox: "/models/d-hitbox.glb",
  },
  {
    name: "E",
    ...typeAConfig,
    model: "/models/type-f-1024.glb",
    hitbox: "/models/e-hitbox.glb",
  },
  {
    name: "F",
    ...typeAConfig,
    model: "/models/type-f-1024.glb",
    hitbox: "/models/f-hitbox.glb",
  },
  {
    name: "G",
    ...typeAConfig,
    model: "/models/type-g.glb",
    hitbox: "/models/g-hitbox.glb",
  },
];

export const DEFAULT_STALE_TIME = 1000 * 60 * 5;
