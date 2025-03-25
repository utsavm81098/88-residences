import { Text, useGLTF } from "@react-three/drei";
import { unitData } from "../../utils/constant";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const FloorPlan = () => {
  const modelRef = useRef();
  const groupRef = useRef();
  const floorRefsContainer = useRef({});
  const floorGroupRefs = useRef({});
  const floorModels = useRef({});
  const [selectedFloor, setSelectedFloor] = useState(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0, 0);

      Object.values(floorRefsContainer.current).forEach((ref) => {
        if (ref) {
          ref.lookAt(camera.position);
        }
      });
    }
  });

  const handleFloorClick = (index) => {
    setSelectedFloor(index);

    // Ensure we have model parts organized by floor
    if (Object.keys(floorModels.current).length === 0) {
      console.warn(
        "No floor models detected - floor detection may not be working correctly"
      );
    }

    // Reset all model parts first
    if (modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          // Reset visibility
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 1;
          }
        }
      });
    }

    // Animate floors based on the selected one
    unitData.forEach((_, i) => {
      const floorGroup = floorGroupRefs.current[i];
      const floorModelParts = floorModels.current[i] || [];

      // Check if we have model parts for this floor
      if (floorModelParts.length === 0) {
        console.warn(`No model parts found for floor ${i}`);
      }

      if (floorGroup) {
        if (i > index) {
          // Animate floors above to slide out
          gsap.to(floorGroup.position, {
            x: 50,
            duration: 0.8,
            ease: "power2.out",
          });

          // Hide model parts for floors above
          floorModelParts.forEach((part) => {
            gsap.to(part.position, {
              x: 50,
              duration: 0.8,
              ease: "power2.out",
            });
            if (part.material) {
              part.material.transparent = true;
              gsap.to(part.material, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
              });
            }
          });

          // UI elements transparency
          floorGroup.traverse((child) => {
            if (child.material) {
              const material = child.material;
              material.transparent = true;
              gsap.to(material, {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out",
              });
            }
          });
        } else if (i < index) {
          // Keep floors below in place
          gsap.to(floorGroup.position, {
            y: 4.5 + i * 3.5,
            duration: 0.8,
          });

          // Show model parts for floors below
          floorModelParts.forEach((part) => {
            gsap.to(part.position, {
              x: 0, // Reset x position
              y: part.userData.originalY || 0,
              duration: 0.8,
            });
            if (part.material) {
              part.material.transparent = true;
              gsap.to(part.material, {
                opacity: 1,
                duration: 0.8,
              });
            }
          });
        } else {
          // Highlight and center the selected floor
          gsap.to(floorGroup.position, {
            x: 0, // Reset x position
            z: -5,
            y: 4.5 + i * 3.5,
            duration: 0.8,
            ease: "back.out",
          });

          // Highlight model parts for selected floor
          floorModelParts.forEach((part) => {
            gsap.to(part.position, {
              x: 0, // Reset x position
              z: part.userData.originalZ ? part.userData.originalZ - 2 : -2,
              duration: 0.8,
              ease: "back.out",
            });
            if (part.material) {
              part.material.transparent = false;
              gsap.to(part.material, {
                opacity: 1,
                duration: 0.8,
              });
            }
          });

          // Scale the selected floor UI
          gsap.to(floorGroup.scale, {
            x: 1.2,
            y: 1.2,
            z: 1.2,
            duration: 0.8,
            ease: "back.out",
          });

          // Change color of text and line
          floorGroup.traverse((child) => {
            if (child.material) {
              gsap.to(child.material.color, {
                r: 0,
                g: 0.64,
                b: 1,
                duration: 0.8,
              });
            }
          });
        }
      }
    });
  };

  return (
    <group ref={groupRef}>
      {unitData.map(({ floor }, index) => (
        <group
          key={index}
          ref={(el) => (floorGroupRefs.current[index] = el)}
          position={[25, 4.5 + index * 3.5, -10]}
          onClick={() => handleFloorClick(index)}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        >
          <mesh position={[-3.7, 0, 0]} rotation={[0, 10, 0]}>
            <planeGeometry args={[8, 0.1]} />
            <meshBasicMaterial color="white" side={2} />
          </mesh>
          <group
            ref={(el) => (floorRefsContainer.current[index] = el)}
            position={[0, 0, -2.2]}
          >
            <Text fontSize={1} color="white" anchorX="center" anchorY="middle">
              {floor}
            </Text>
          </group>
        </group>
      ))}
    </group>
  );
};

export default FloorPlan;
