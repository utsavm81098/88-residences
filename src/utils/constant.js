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

export const EXPOSURE = -1.4;

export const CANVAS_GL_CONFIG = {
  antialias: true,
  toneMapping: THREE.LinearToneMapping,
  toneMappingExposure: Math.pow(2, EXPOSURE),
  powerPreference: "high-performance",
  outputColorSpace: THREE.SRGBColorSpace,
};

export const BUILDING_CONFIG = [
  {
    name: "Type F",
    model: "/models/type-f-1024.glb",
    hitbox: "/models/type-f-hitbox.glb",
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
  },

  // {
  //   name: "Type D",
  //   model: "/models/type-d-1024.glb",
  //   hitbox: "/models/d-hitbox.glb",
  //   environment: {
  //     files: "/hdr/kloofendal_48d_partly_cloudy_puresky_2k.hdr",
  //     background: false,
  //     environmentIntensity: 0.25, // Reduce the HDR's overpowering sun
  //   },
  //   lighting: {
  //     directIntensity: 1.0, // Sun-side stationary light
  //     fillIntensity: 1.5, // Opposite side stationary light (North-West) to kill HDR shadows
  //     ambientIntensity: 0.8, // Ambient base lift
  //     exposure: 1.0,
  //   },
  //   // heroAngle: Math.PI / 3, // 60° — slightly more rotated
  // },
  // {
  //   name: "Type A",
  //   // model: "/models/type-a.glb",
  //   model: "/models/type-a-1024.glb",
  //   hitbox: "/models/a-hitbox.glb",
  //   environment: {
  //     preset: "city",
  //     background: false,
  //   },
  //   // heroAngle: -Math.PI / 5, // -36° — front-left view
  // },
  // {
  //   name: "Type G",
  //   // model: "/models/type-a.glb",
  //   model: "/models/type-g.glb",
  //   hitbox: "/models/g-hitbox.glb",
  //   environment: {
  //     preset: "city",
  //     background: false,
  //   },
  //   // heroAngle: Math.PI / 6, // 30° — subtle right angle
  // },
  // {
  //   name: "Type B",
  //   // model: "/models/type-a.glb",
  //   model: "/models/type-b.glb",
  //   hitbox: "/models/a-hitbox.glb",
  //   environment: {
  //     preset: "city",
  //     background: false,
  //   },
  //   // heroAngle: -Math.PI / 4, // -45° — front-left corner view
];

export const DEFAULT_STALE_TIME = 1000 * 60 * 5;

