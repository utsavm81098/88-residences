import { Text } from "@react-three/drei";

const FloorPlan = () => {
  return (
    <group position={[0, 1, 40]}>
      <Text
        position={[0, 0, 0]}
        fontSize={1.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        index
      </Text>
    </group>
  );
};

export default FloorPlan;
