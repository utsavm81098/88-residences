import { useMemo, useEffect } from "react";
import * as THREE from "three";

/**
 * Dark matte ground plane that sits beneath the gold grid lines.
 * Provides a near-black surface (#0a0a0e) with very subtle noise texture
 * to avoid looking completely flat, while keeping focus on the building.
 */
const GroundSurface = () => {
  const { map, roughnessMap } = useMemo(() => {
    const size = 512;

    // --- Base color canvas: near-black matte surface ---
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    // Near-black base
    ctx.fillStyle = "#0a0a0e";
    ctx.fillRect(0, 0, size, size);

    // Very subtle noise for surface micro-texture (avoids dead-flat CG look)
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random() > 0.5 ? 255 : 0;
      const opacity = Math.random() * 0.015;
      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${opacity})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle dark vignette patches for organic variation
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 60 + 20;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, "rgba(15, 12, 8, 0.04)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Roughness canvas: mostly rough/matte ---
    const roughnessCanvas = document.createElement("canvas");
    const rCtx = roughnessCanvas.getContext("2d");
    roughnessCanvas.width = size;
    roughnessCanvas.height = size;

    // High roughness base (matte surface)
    rCtx.fillStyle = "#e0e0e0";
    rCtx.fillRect(0, 0, size, size);

    // Slight roughness variation
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const val = Math.floor(Math.random() * 20);
      rCtx.fillStyle = `rgb(${215 + val}, ${215 + val}, ${215 + val})`;
      rCtx.fillRect(x, y, 2, 2);
    }

    // Create Three.js textures
    const mapTex = new THREE.CanvasTexture(canvas);
    const roughTex = new THREE.CanvasTexture(roughnessCanvas);

    const repeatCount = 20;
    [mapTex, roughTex].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatCount, repeatCount);
      tex.anisotropy = 8;
    });

    return { map: mapTex, roughnessMap: roughTex };
  }, []);

  useEffect(() => {
    return () => {
      map.dispose();
      roughnessMap.dispose();
    };
  }, [map, roughnessMap]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      receiveShadow
      renderOrder={-1}
    >
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial
        map={map}
        roughnessMap={roughnessMap}
        roughness={0.95}
        metalness={0.0}
        color="#0a0a0e"
        transparent
        opacity={0.99}
        depthWrite={false}
      />
    </mesh>
  );
};

export default GroundSurface;
