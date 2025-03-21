import { Color, MeshStandardMaterial } from "three";

export const unitData = [
  {
    floor: 1,
    units: [
      {
        name: "Box005",
        status: "available",
        type: "1BHK",
        area: "750 sq ft",
        price: "$250,000",
        floor: 1,
        direction: "North-East",
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
    ],
  },
  {
    floor: 2,
    units: [
      {
        name: "Box006",
        status: "available",
        type: "2BHK",
        area: "1050 sq ft",
        price: "$350,000",
        floor: 1,
        direction: "North-West",
      },
      {
        status: "available",
        type: "2BHK",
        area: "1050 sq ft",
        price: "$355,000",
        floor: 2,
        direction: "North-West",
        name: "Box014",
      },
    ],
  },
  {
    floor: 3,
    units: [
      {
        status: "available",
        type: "1BHK",
        area: "750 sq ft",
        price: "$255,000",
        floor: 2,
        direction: "North-East",
        name: "Box007",
      },
      {
        status: "sold",
        type: "2BHK",
        area: "1050 sq ft",
        price: "$355,000",
        floor: 2,
        direction: "North-West",
        name: "Box015",
      },
    ],
  },
  {
    floor: 4,
    units: [
      {
        status: "sold",
        type: "2BHK",
        area: "1050 sq ft",
        price: "$355,000",
        floor: 2,
        direction: "North-West",
        name: "Box008",
      },
      {
        status: "sold",
        type: "3BHK",
        area: "1750 sq ft",
        price: "$550,000",
        floor: 5,
        direction: "South-East",
        name: "Box016",
      },
    ],
  },
];

export const statusType = {
  SOLD: "sold",
  AVAILABLE: "available",
};
export const baseMaterials = ({ status }) => {
  return {
    color: new MeshStandardMaterial({
      color: new Color(status === statusType.SOLD ? "#ff0000" : "#0080ff"),
      transparent: true,
      opacity: 0.3,
    }),
    selected: new MeshStandardMaterial({
      color: new Color(status === statusType.SOLD ? "#ff3333" : "#33aaff"),
      transparent: true,
      opacity: 0.7,
      emissive: new Color(status === statusType.SOLD ? "#ff0000" : "#0080ff"),
      emissiveIntensity: 0.5,
      wireframe: false,
    }),
    hover: new MeshStandardMaterial({
      color: new Color(status === statusType.SOLD ? "#ff3333" : "#33aaff"),
      transparent: true,
      opacity: 0.7,
      emissive: new Color(status === statusType.SOLD ? "#ff0000" : "#0080ff"),
      emissiveIntensity: 0.5,
    }),
  };
};
