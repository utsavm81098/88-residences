import { Text, Billboard } from "@react-three/drei";
import useDirectionLabel from "./use-direction-label";
import { memo } from "react";

const DIRECTION_NAMES = {
  N: "NORTH",
  S: "SOUTH",
  E: "EAST",
  W: "WEST",
};

const Label = ({ children, position, onClick, fontSize }) => (
  <Billboard
    position={position}
    follow
    lockX={false}
    lockY={false}
    lockZ={false}
  >
    <Text
      fontSize={fontSize}
      color="white"
      anchorX="center"
      anchorY="middle"
      depthTest={false}
      renderOrder={100}
      onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      {children}
    </Text>
  </Billboard>
);

const DirectionLabel = ({ controlsRef }) => {
  const { positions, fontSize, moveCamera } = useDirectionLabel({
    controlsRef,
  });

  return (
    <group>
      {Object.entries(positions).map(([dir, pos]) => (
        <Label
          key={dir}
          position={pos}
          fontSize={fontSize}
          onClick={() => moveCamera(dir)}
        >
          {DIRECTION_NAMES[dir]}
        </Label>
      ))}
    </group>
  );
};

export default memo(DirectionLabel);
