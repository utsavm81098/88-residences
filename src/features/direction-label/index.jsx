import { Text, Billboard } from "@react-three/drei";
import useDirectionLabel from "./use-direction-label";
import { memo } from "react";
import { useSelector } from "react-redux";

const DIRECTION_NAMES = {
  N: "NORTH",
  S: "SOUTH",
  E: "EAST",
  W: "WEST",
};

const Label = ({ children, position, onClick, fontSize, isDragging }) => (
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
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 2) onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!isDragging) document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        if (!isDragging) document.body.style.cursor = "auto";
      }}
    >
      {children}
    </Text>
  </Billboard>
);

const DirectionLabel = ({ controlsRef }) => {
  const { positions, fontSize, moveCamera } = useDirectionLabel({
    controlsRef,
  });
  const isDragging = useSelector((state) => state.drag.isDragging);

  return (
    <group>
      {Object.entries(positions).map(([dir, pos]) => (
        <Label
          key={dir}
          position={pos}
          fontSize={fontSize}
          isDragging={isDragging}
          onClick={() => moveCamera(dir)}
        >
          {DIRECTION_NAMES[dir]}
        </Label>
      ))}
    </group>
  );
};

export default memo(DirectionLabel);
