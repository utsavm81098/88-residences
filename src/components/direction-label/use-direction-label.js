import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import React, { useCallback, useMemo } from "react";

// ✅ Same breakpoints as useFitCamera — single source of truth
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

// ✅ Label config scales with camera distance per device
const LABEL_CONFIG = {
  mobile: { distance: 25, fontSize: 1.2 },
  tablet: { distance: 28, fontSize: 1.2 },
  desktop: { distance: 30, fontSize: 1.5 }, // your original values
};

function getLabelConfig(width) {
  if (width < BREAKPOINTS.mobile) return LABEL_CONFIG.mobile;
  if (width < BREAKPOINTS.tablet) return LABEL_CONFIG.tablet;
  return LABEL_CONFIG.desktop;
}

// ✅ Module-level reusable vectors
const _newPos = new THREE.Vector3();
const _offset = new THREE.Vector3();

const useDirectionLabel = ({ controlsRef }) => {
  const { camera, size: viewportSize } = useThree();

  // ✅ Recalculates automatically on resize — same as useFitCamera
  const { distance, fontSize } = useMemo(
    () => getLabelConfig(viewportSize.width),
    [viewportSize.width],
  );

  const positions = useMemo(
    () => ({
      N: [0, 1, -distance],
      S: [0, 1, distance],
      E: [distance, 1, 0],
      W: [-distance, 1, 0],
    }),
    [distance],
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

  return { positions, fontSize, moveCamera };
};

export default useDirectionLabel;
