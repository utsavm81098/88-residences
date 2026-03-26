import { Color, MeshStandardMaterial } from "three";

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
export const getUnitMaterialConfig = ({ status }) => {
  const isSold = status === statusType.SOLD;

  // Premium Palette
  const availableColor = new Color("#2563eb"); // Electric Blue
  const soldColor = new Color("#f43f5e");      // Rose/Deep Red

  return {
    baseColor: isSold ? soldColor : availableColor,
    hoverColor: isSold ? soldColor : availableColor,

    // Glass effect settings
    baseOpacity: isSold ? 0.05 : 0.2, // Slightly more visible available color
    hoverOpacity: 0.7,                 // Stronger hover glow

    emissive: isSold ? soldColor : availableColor,
  };
};
