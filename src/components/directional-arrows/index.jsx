import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import gsap from "gsap";
import { Vector3 } from "three";
import { useControls } from "../../context/ControlsContext";

const DirectionalArrows = () => {
  const groupRef = useRef();
  const northTextRef = useRef();
  const southTextRef = useRef();
  const eastTextRef = useRef();
  const westTextRef = useRef();
  const controlsRef = useControls();
  const [isAnimating, setIsAnimating] = useState(false);
  const originalSettingsRef = useRef(null);
  const { camera } = useThree();

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);

      if (northTextRef.current) northTextRef.current.lookAt(camera.position);
      if (southTextRef.current) southTextRef.current.lookAt(camera.position);
      if (eastTextRef.current) eastTextRef.current.lookAt(camera.position);
      if (westTextRef.current) westTextRef.current.lookAt(camera.position);
    }
  });

  const rotateCamera = (direction) => {
    if (!controlsRef?.current || isAnimating) return;

    setIsAnimating(true);

    // Cancel any ongoing animations
    gsap.killTweensOf(controlsRef.current.target);
    gsap.killTweensOf(camera.position);

    // Store current camera position and target
    const currentPosition = camera.position.clone();
    const currentTarget = controlsRef.current.target.clone();

    // Store current settings to restore later
    if (!originalSettingsRef.current) {
      originalSettingsRef.current = {
        enabled: controlsRef.current.enabled,
        minDistance: controlsRef.current.minDistance,
        maxDistance: controlsRef.current.maxDistance,
        enableZoom: controlsRef.current.enableZoom,
        enableRotate: controlsRef.current.enableRotate,
        enablePan: controlsRef.current.enablePan,
      };
    }

    // Temporarily disable controls during animation
    controlsRef.current.enabled = false;

    // Calculate camera properties
    const distance = currentPosition.distanceTo(currentTarget);

    // Calculate height difference (vertical position)
    const height = currentPosition.y - currentTarget.y;

    // Calculate horizontal distance using Pythagorean theorem
    const horizontalDistance = Math.sqrt(distance * distance - height * height);

    // Calculate new position based on direction
    let newPosition;
    switch (direction) {
      case "north":
        // Position camera to the north, keep same height and distance
        newPosition = new Vector3(
          currentTarget.x, // x at center
          currentTarget.y + height, // Keep same height
          currentTarget.z - horizontalDistance // Move to north
        );
        break;
      case "south":
        newPosition = new Vector3(
          currentTarget.x, // x at center
          currentTarget.y + height, // Keep same height
          currentTarget.z + horizontalDistance // Move to south
        );
        break;
      case "east":
        newPosition = new Vector3(
          currentTarget.x + horizontalDistance, // Move to east
          currentTarget.y + height, // Keep same height
          currentTarget.z // z at center
        );
        break;
      case "west":
        newPosition = new Vector3(
          currentTarget.x - horizontalDistance, // Move to west
          currentTarget.y + height, // Keep same height
          currentTarget.z // z at center
        );
        break;
      default:
        setIsAnimating(false);
        return;
    }

    // Animate camera position to the new location with direct path (no 360° rotation)
    gsap.to(camera.position, {
      x: newPosition.x,
      y: newPosition.y,
      z: newPosition.z,
      duration: 1.5,
      ease: "power3.inOut",
      onUpdate: () => {
        // Keep camera looking at the target during animation
        camera.lookAt(currentTarget);
        controlsRef.current.update();
      },
      onComplete: () => {
        // Restore original settings
        if (originalSettingsRef.current) {
          Object.keys(originalSettingsRef.current).forEach((key) => {
            controlsRef.current[key] = originalSettingsRef.current[key];
          });
        }

        // Make sure zoom is enabled
        controlsRef.current.enableZoom = true;
        controlsRef.current.enabled = true;

        // Update controls one last time
        controlsRef.current.update();

        // Reset state and clear settings
        setIsAnimating(false);
        originalSettingsRef.current = null;
      },
    });
  };

  return (
    <group ref={groupRef}>
      <group ref={northTextRef} position={[0, 1, -30]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          onClick={() => rotateCamera("north")}
          onPointerOver={() =>
            !isAnimating && (document.body.style.cursor = "pointer")
          }
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          North
        </Text>
      </group>
      <group ref={westTextRef} position={[-30, 1, 0]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          onClick={() => rotateCamera("west")}
          onPointerOver={() =>
            !isAnimating && (document.body.style.cursor = "pointer")
          }
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          West
        </Text>
      </group>

      <group ref={eastTextRef} position={[30, 1, 0]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          onClick={() => rotateCamera("east")}
          onPointerOver={() =>
            !isAnimating && (document.body.style.cursor = "pointer")
          }
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          East
        </Text>
      </group>
      <group ref={southTextRef} position={[0, 1, 30]}>
        <Text
          position={[0, 0, 0]}
          fontSize={1.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          onClick={() => rotateCamera("south")}
          onPointerOver={() =>
            !isAnimating && (document.body.style.cursor = "pointer")
          }
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          South
        </Text>
      </group>
    </group>
  );
};

export default DirectionalArrows;
