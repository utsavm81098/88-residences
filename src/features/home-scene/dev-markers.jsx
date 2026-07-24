import React, { useRef, useState, useEffect } from "react";
import { TransformControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

/**
 * DEV-only: Draggable target marker (red) + camera position marker (green).
 * - Red sphere: drag to reposition orbit target → values update in HUD
 * - Green sphere: follows camera position in real-time
 */
export const DevMarkers = ({ controlsRef, onCameraChange }) => {
  const [targetMesh, setTargetMesh] = useState(null);
  const cameraMeshRef = useRef();
  const isDraggingRef = useRef(false);

  useFrame(({ camera }) => {
    const controls = controlsRef.current;

    if (!controls || !targetMesh) return;

    if (isDraggingRef.current) {
      // While dragging red marker → push its position to orbit target
      controls.target.copy(targetMesh.position);
      controls.update();
    } else {
      // While NOT dragging → sync red marker FROM orbit target (e.g. after user pans)
      targetMesh.position.copy(controls.target);
    }

    // Update green marker to follow camera
    if (cameraMeshRef.current) {
      cameraMeshRef.current.position.copy(camera.position);
    }

    // Report both values to HUD
    if (onCameraChange) {
      const t = controls.target;
      onCameraChange({
        position: [
          parseFloat(camera.position.x.toFixed(2)),
          parseFloat(camera.position.y.toFixed(2)),
          parseFloat(camera.position.z.toFixed(2)),
        ],
        target: [
          parseFloat(t.x.toFixed(2)),
          parseFloat(t.y.toFixed(2)),
          parseFloat(t.z.toFixed(2)),
        ],
      });
    }
  });

  return (
    <>
      {/* Red marker — Draggable orbit target */}
      {targetMesh && (
        <TransformControls
          object={targetMesh}
          mode="translate"
          size={0.6}
          onDraggingChanged={(e) => {
            isDraggingRef.current = e.value;
            if (controlsRef.current) {
              controlsRef.current.enabled = !e.value;
            }
          }}
        />
      )}
      <mesh ref={setTargetMesh} position={[-9.49, 19.47, -21.04]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ff0000" opacity={0.8} transparent />
      </mesh>

      {/* Green marker — Camera position (read-only, follows camera) */}
      <mesh ref={cameraMeshRef}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#00ff00" opacity={0.8} transparent />
      </mesh>
    </>
  );
};

export default DevMarkers;
