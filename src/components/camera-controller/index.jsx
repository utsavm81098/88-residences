import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useEffect, useMemo } from "react";
import { useControls } from "../../context/ControlsContext";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const Y_AXIS = new THREE.Vector3(0, 1, 0);

const CameraController = () => {
  const { camera, gl } = useThree();
  const controlsRef = useRef();
  const controlsContext = useControls();

  // Constants defined once
  const MIN_DISTANCE = 40;
  const MAX_DISTANCE = 100;
  const TARGET_Y = 10;

  const targetPosition = useMemo(() => new THREE.Vector3(0, TARGET_Y, 0), []);
  const directionVector = useMemo(() => new THREE.Vector3(), []);
  const tempVector = useMemo(() => new THREE.Vector3(), []);
  const tempOffset = useMemo(() => new THREE.Vector3(), []);

  const state = useRef({
    initialized: false,
    isKeyboardMoving: false,
    keyboardMoveTimeout: null,
    keys: { left: false, right: false, up: false, down: false },
    lastFrameTime: 0,
    prevPosition: new THREE.Vector3(),
  });

  useEffect(() => {
    if (!camera) return;

    camera.position.set(80, TARGET_Y, 80);
    camera.lookAt(targetPosition);
    state.current.prevPosition.copy(camera.position);

    if (controlsRef.current) {
      controlsContext.current = controlsRef.current;
      controlsRef.current.enableKeys = false;
    }

    const handleKeyDown = (event) => {
      // Block zoom keys early
      if (["+", "-", "=", "_"].includes(event.key)) {
        event.preventDefault();
        return;
      }

      if (event.key === "ArrowLeft") state.current.keys.left = true;
      else if (event.key === "ArrowRight") state.current.keys.right = true;
      else if (event.key === "ArrowUp") state.current.keys.up = true;
      else if (event.key === "ArrowDown") state.current.keys.down = true;
      else return;

      state.current.isKeyboardMoving = true;
      clearTimeout(state.current.keyboardMoveTimeout);
      state.current.keyboardMoveTimeout = setTimeout(() => {
        state.current.isKeyboardMoving = false;
      }, 300);
    };

    const handleKeyUp = (event) => {
      if (event.key === "ArrowLeft") state.current.keys.left = false;
      else if (event.key === "ArrowRight") state.current.keys.right = false;
      else if (event.key === "ArrowUp") state.current.keys.up = false;
      else if (event.key === "ArrowDown") state.current.keys.down = false;
    };

    // Use passive event listeners where possible for better performance
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (state.current.keyboardMoveTimeout) {
        clearTimeout(state?.current?.keyboardMoveTimeout);
      }
    };
  }, [camera, controlsContext, targetPosition]);

  useFrame((_, delta) => {
    if (!controlsRef.current || !camera) return;

    if (!state.current.initialized) {
      camera.lookAt(targetPosition);
      state.current.initialized = true;
    }

    controlsRef.current.target.copy(targetPosition);

    controlsRef.current.dampingFactor = state.current.isKeyboardMoving
      ? 0.15
      : 0.05;

    if (state.current.isKeyboardMoving) {
      const { keys } = state.current;
      if (keys.left || keys.right) {
        tempOffset.subVectors(camera.position, targetPosition);

        const rotationSpeed = 0.03 * delta * 60;
        const direction = keys.left ? rotationSpeed : -rotationSpeed;

        if (keys.left || keys.right) {
          tempOffset.applyAxisAngle(Y_AXIS, direction);
          camera.position.copy(targetPosition).add(tempOffset);
          camera.lookAt(targetPosition);
        }
      }
    }

    // Calculate and enforce distance constraints
    const currentDistance = camera.position.distanceToSquared(targetPosition);
    const minDistanceSquared = MIN_DISTANCE * MIN_DISTANCE;
    const maxDistanceSquared = MAX_DISTANCE * MAX_DISTANCE;

    if (
      currentDistance < minDistanceSquared ||
      currentDistance > maxDistanceSquared
    ) {
      const actualDistance = Math.sqrt(currentDistance);
      const clampedDistance = Math.max(
        MIN_DISTANCE,
        Math.min(actualDistance, MAX_DISTANCE)
      );

      directionVector.subVectors(camera.position, targetPosition).normalize();

      tempVector
        .copy(targetPosition)
        .addScaledVector(directionVector, clampedDistance);

      const transitionSpeed = state.current.isKeyboardMoving ? 0.1 : 0.2;
      camera.position.lerp(tempVector, transitionSpeed);

      camera.updateMatrixWorld();
    }

    state.current.prevPosition.copy(camera.position);

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={Math.PI / 2.5}
      maxPolarAngle={Math.PI / 2}
      maxPan={[Infinity, TARGET_Y, Infinity]}
      minPan={[Infinity, -TARGET_Y, Infinity]}
      enableDamping
      dampingFactor={0.05}
      target={[0, TARGET_Y, 0]}
      enableKeys={false}
      rotateSpeed={0.5}
    />
  );
};

export default CameraController;
