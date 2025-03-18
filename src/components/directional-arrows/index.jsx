import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const DirectionalArrows = () => {
  const groupRef = useRef();
  const northTextRef = useRef();
  const southTextRef = useRef();
  const eastTextRef = useRef();
  const westTextRef = useRef();

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);

      if (northTextRef.current) northTextRef.current.lookAt(camera.position);
      if (southTextRef.current) southTextRef.current.lookAt(camera.position);
      if (eastTextRef.current) eastTextRef.current.lookAt(camera.position);
      if (westTextRef.current) westTextRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={northTextRef} position={[20, 1, 20]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          North
        </Text>
      </group>

      <group ref={southTextRef} position={[20, 1, -20]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          West
        </Text>
      </group>

      <group ref={eastTextRef} position={[-20, 1, 20]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          East
        </Text>
      </group>

      <group ref={westTextRef} position={[-20, 1, -20]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          South
        </Text>
      </group>
    </group>
  );
};

export default DirectionalArrows;
