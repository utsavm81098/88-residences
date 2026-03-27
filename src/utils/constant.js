import * as THREE from "three";

export const unitData = [
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
];
export const statusType = {
  SOLD: "sold",
  AVAILABLE: "available",
};

export const UNIT_COLORS = {
  available: {
    base: new THREE.Color("#6B8EB5"), // muted steel-blue (subtle tint)
    hover: new THREE.Color("#3B8BF5"), // bright vivid blue (hover pop)
    baseOpacity: 0.1, // subtle see-through
    hoverOpacity: 0.6, // clearly visible bright blue
  },
  sold: {
    base: new THREE.Color("#D0D0D0"), // faint white-grey
    hover: new THREE.Color("#FFFFFF"), // bright white
    baseOpacity: 0.1, // barely visible
    hoverOpacity: 0.6, // clearly visible white
  },
};
export const OUTLINE_KEY = "__edgeLines";
