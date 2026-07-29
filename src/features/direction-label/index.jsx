import { Text, Billboard } from "@react-three/drei";
import useDirectionLabel, { useLabel } from "./use-direction-label";
import { memo } from "react";
import { useTranslation } from "react-i18next";

const DIRECTION_NAMES = {
  N: "NORTH",
  S: "SOUTH",
  E: "Sea Side - East",
  W: "WEST",
};

const Label = memo(function Label({
  children,
  position,
  onMoveCamera,
  dir,
  fontSize,
  isDragging,
}) {
  const { textRef, handleClick, handlePointerOver, handlePointerOut } =
    useLabel({
      isDragging,
      dir,
      onMoveCamera,
    });

  return (
    <Billboard
      position={position}
      follow
      lockX={false}
      lockY={false}
      lockZ={false}
    >
      <Text
        ref={textRef}
        fontSize={fontSize}
        color="black"
        anchorX="center"
        anchorY="middle"
        depthTest={false}
        renderOrder={100}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {children}
      </Text>
    </Billboard>
  );
});

const DirectionLabel = ({ controlsRef }) => {
  const { t } = useTranslation();
  const { positions, fontSize, moveCamera, isDragging, isTransitioning } =
    useDirectionLabel({
      controlsRef,
    });

  // Hide labels immediately while the building transitions
  if (isTransitioning) return null;

  return (
    <group>
      {Object.entries(positions).map(([dir, pos]) => (
        <Label
          key={dir}
          dir={dir}
          position={pos}
          fontSize={fontSize}
          isDragging={isDragging}
          onMoveCamera={moveCamera}
        >
          {t(`direction_${dir.toLowerCase()}`, DIRECTION_NAMES[dir])}
        </Label>
      ))}
    </group>
  );
};

export default memo(DirectionLabel);
