import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import useResponsiveConfig from "@/hooks/use-responsive-config";

// ✅ Module-level reusable vectors
const _newPos = new THREE.Vector3();
const _offset = new THREE.Vector3();

export const useLabel = ({ isDragging, dir, onMoveCamera }) => {
  const textRef = useRef();

  useEffect(() => {
    let tween;
    if (textRef.current && textRef.current.material) {
      textRef.current.material.transparent = true;
      tween = gsap.fromTo(
        textRef.current.material,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: "power2.out" },
      );
    }
    // Cleanup tween to prevent memory leaks or animation artifacts on unmount
    return () => {
      if (tween) tween.kill();
    };
  }, []);

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.delta <= 2) onMoveCamera(dir);
    },
    [dir, onMoveCamera],
  );

  const handlePointerOver = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isDragging) document.body.style.cursor = "pointer";
    },
    [isDragging],
  );

  const handlePointerOut = useCallback(
    (e) => {
      e.stopPropagation();
      if (!isDragging) document.body.style.cursor = "auto";
    },
    [isDragging],
  );

  return { textRef, handleClick, handlePointerOver, handlePointerOut };
};

const useDirectionLabel = ({ controlsRef }) => {
  const { camera } = useThree();
  const config = useResponsiveConfig();
  const isDragging = useSelector((state) => state.drag.isDragging);
  const isTransitioning = useSelector(
    (state) => state.building.isTransitioning,
  );

  const { distanceX, distanceZ, fontSize } = config.label;

  const positions = useMemo(
    () => ({
      N: [0, 0.8, -distanceZ],
      S: [0, 0.8, distanceZ],
      E: [distanceX, 0.8, 0],
      W: [-distanceX, 0.8, 0],
    }),
    [distanceX, distanceZ],
  );

  const moveCamera = useCallback(
    (direction) => {
      const controls = controlsRef.current;
      if (!controls) return;

      const target = controls.target.clone();

      // ✅ Reuse _offset instead of camera.position.clone()
      _offset.copy(camera.position).sub(target);

      const radius = Math.sqrt(_offset.x * _offset.x + _offset.z * _offset.z);
      const height = _offset.y;
      const startAngle = Math.atan2(_offset.x, _offset.z);

      const TARGET_ANGLES = {
        N: Math.PI,
        E: Math.PI / 2,
        S: 0,
        W: -Math.PI / 2,
      };

      // ✅ Guard for unknown directions
      if (!(direction in TARGET_ANGLES)) return;

      const rawEnd = TARGET_ANGLES[direction];

      // Shortest path wrap
      const endAngle =
        startAngle +
        THREE.MathUtils.euclideanModulo(
          rawEnd - startAngle + Math.PI,
          Math.PI * 2,
        ) -
        Math.PI;

      gsap.to(
        { angle: startAngle },
        {
          angle: endAngle,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: function () {
            const a = this.targets()[0].angle;

            // ✅ Reuse _newPos instead of new THREE.Vector3() every frame
            _newPos
              .set(Math.sin(a) * radius, height, Math.cos(a) * radius)
              .add(target);

            camera.position.copy(_newPos);
            camera.lookAt(target);
            controls.update();
          },
        },
      );
    },
    [camera, controlsRef],
  );

  return { positions, fontSize, moveCamera, isDragging, isTransitioning };
};

export default useDirectionLabel;
