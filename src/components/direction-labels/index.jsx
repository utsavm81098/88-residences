import { Text, Billboard } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo } from "react";
import * as THREE from "three";

const Label = ({ children, position, onClick }) => (
  <Billboard
    position={position}
    follow
    lockX={false}
    lockY={false}
    lockZ={false}
  >
    <Text
      fontSize={1.5}
      color="white"
      anchorX="center"
      anchorY="middle"
      //   outlineWidth={0.25}
      //   outlineColor="#000000"
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

export default function DirectionLabels({ controlsRef }) {
  const { camera } = useThree();
  const d = 30;

  const positions = useMemo(
    () => ({
      N: [0, 1, -d],
      S: [0, 1, d],
      E: [d, 1, 0],
      W: [-d, 1, 0],
    }),
    [d],
  );
  const moveCamera = useCallback(
    (direction) => {
      const controls = controlsRef.current;
      if (!controls) return;

      const target = controls.target.clone();
      const offset = camera.position.clone().sub(target);

      const radius = Math.sqrt(offset.x * offset.x + offset.z * offset.z);
      const height = offset.y;

      let startAngle = Math.atan2(offset.x, offset.z);
      let endAngle = startAngle;

      switch (direction) {
        case "N":
          endAngle = Math.PI; // -Z direction
          break;

        case "E":
          endAngle = Math.PI / 2; // +X
          break;

        case "S":
          endAngle = 0; // +Z
          break;

        case "W":
          endAngle = -Math.PI / 2; // -X
          break;

        default:
          return;
      }

      endAngle =
        startAngle +
        THREE.MathUtils.euclideanModulo(
          endAngle - startAngle + Math.PI,
          Math.PI * 2,
        ) -
        Math.PI;

      // animate angle (NOT position)
      gsap.to(
        { angle: startAngle },
        {
          angle: endAngle,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: function () {
            const a = this.targets()[0].angle;

            const newPos = new THREE.Vector3(
              Math.sin(a) * radius,
              height,
              Math.cos(a) * radius,
            ).add(target);

            camera.position.copy(newPos);
            camera.lookAt(target);
            controls.update();
          },
        },
      );
    },
    [camera, controlsRef],
  );

  return (
    <group>
      <Label position={positions.N} onClick={() => moveCamera("N")}>
        NORTH
      </Label>

      <Label position={positions.S} onClick={() => moveCamera("S")}>
        SOUTH
      </Label>

      <Label position={positions.E} onClick={() => moveCamera("E")}>
        EAST
      </Label>

      <Label position={positions.W} onClick={() => moveCamera("W")}>
        WEST
      </Label>
    </group>
  );
}
