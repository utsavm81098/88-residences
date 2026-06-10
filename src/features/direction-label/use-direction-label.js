import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import gsap from "gsap";
import { useCallback, useMemo, useEffect, useRef, useState } from "react";
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

const LABEL_TRANSITION_DURATION = 0.6;

const useDirectionLabel = ({ controlsRef }) => {
  const { camera } = useThree();
  const config = useResponsiveConfig();
  const isDragging = useSelector((state) => state.drag.isDragging);
  const isTransitioning = useSelector(
    (state) => state.building.isTransitioning,
  );

  // Animated label values — GSAP-animate on breakpoint change
  const [labelValues, setLabelValues] = useState({
    distanceX: config.label.distanceX,
    distanceZ: config.label.distanceZ,
    fontSize: config.label.fontSize,
  });
  const prevConfigRef = useRef(config);
  const tweenRef = useRef(null);
  const cameraTweenRef = useRef(null);

  useEffect(() => {
    const prevConfig = prevConfigRef.current;
    prevConfigRef.current = config;

    // Skip on initial render (same reference)
    if (prevConfig === config) return;

    const prevLabel = prevConfig.label;
    const nextLabel = config.label;

    // No change needed
    if (
      prevLabel.distanceX === nextLabel.distanceX &&
      prevLabel.distanceZ === nextLabel.distanceZ &&
      prevLabel.fontSize === nextLabel.fontSize
    )
      return;

    // Kill any in-progress label transition
    if (tweenRef.current) {
      tweenRef.current.kill();
    }

    const animated = {
      distanceX: prevLabel.distanceX,
      distanceZ: prevLabel.distanceZ,
      fontSize: prevLabel.fontSize,
    };

    tweenRef.current = gsap.to(animated, {
      distanceX: nextLabel.distanceX,
      distanceZ: nextLabel.distanceZ,
      fontSize: nextLabel.fontSize,
      duration: LABEL_TRANSITION_DURATION,
      ease: "power2.inOut",
      onUpdate: () => {
        setLabelValues({
          distanceX: animated.distanceX,
          distanceZ: animated.distanceZ,
          fontSize: animated.fontSize,
        });
      },
      onComplete: () => {
        tweenRef.current = null;
      },
    });

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill();
        tweenRef.current = null;
      }
      if (cameraTweenRef.current) {
        cameraTweenRef.current.kill();
        cameraTweenRef.current = null;
      }
    };
  }, [config]);

  const { distanceX, distanceZ, fontSize } = labelValues;

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

      // Kill any in-flight camera move before starting a new one
      if (cameraTweenRef.current) {
        cameraTweenRef.current.kill();
      }

      cameraTweenRef.current = gsap.to(
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
          onComplete: () => {
            cameraTweenRef.current = null;
          },
        },
      );
    },
    [camera, controlsRef],
  );

  return { positions, fontSize, moveCamera, isDragging, isTransitioning };
};

export default useDirectionLabel;
