import { memo, useEffect, useState } from "react";
import { useLoader, useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HOME_ENV_PATH, HOME_EXPOSURE } from "@/utils/constant";
import { logger } from "@/utils/logger";

// Target window/glass materials for mirror-like panorama reflection
const GLASS_MATERIALS_RE =
  /glass|win_glass|material__2558|material__2556|window/i;

// Nodes whose names contain "GLASS" (or whose materials match the regex) but
// are NOT building window panes — they must NOT receive the HDR mirror treatment.
// • GLASS_Line*   → pool/water-edge geometry
// • Obj_RAILING*  → balcony glass railing panels (get their own transparent treatment
//                   in use-home-scene.js instead)
const GLASS_NODE_EXCLUSION_RE = /^GLASS_Line|^Obj_RAILING/i;

// Static cache for PMREM environment maps to avoid re-allocating GPU targets on every route switch
let cachedGl = null;
let cachedGreenEnvMap = null;
let cachedNeutralEnvMap = null;

// Top-level chunk roots (direct children of the merged group
// use-home-scene.js/use-glb-chunks-loader.js build up) already scanned for
// glass materials. Mirrors use-home-scene.js's tunedTopLevelNodes WeakSet —
// same rationale: a chunk arrives as a whole subtree in one shot, so
// tracking membership at that granularity keeps this effect's traversal at
// O(new chunks) per merge instead of re-scanning every previously-processed
// building's glass on every chunk arrival.
const glassProcessedTopLevelNodes = new WeakSet();

/**
 * Applies neutral RoomEnvironment IBL for overall scene lighting (so shadows and foliage
 * stay bright and natural), while specifically applying the 80m-nano-green.jpg HDR panorama
 * reflection to building window glass materials.
 */
const EnvironmentSetup = ({
  modelScene,
  modelVersion,
  environmentRotation,
  active = true,
}) => {
  const rootScene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  const panorama = useLoader(THREE.TextureLoader, HOME_ENV_PATH);

  // Forces the main effect below to re-run after a WebGL context restore —
  // see the listener effect's comment for why `cachedGl !== gl` alone can
  // never detect this case.
  const [contextGeneration, setContextGeneration] = useState(0);

  // A `webglcontextlost`/`webglcontextrestored` cycle (confirmed real on
  // mobile GPUs under memory pressure from repeatedly navigating Home <->
  // Inventory — the unified canvas in containers/scene-canvas holds both
  // scenes' GPU resources at once) reuses the SAME WebGLRenderer instance:
  // `gl` here never changes identity. The regeneration guard below
  // (`cachedGl !== gl || !greenEnvMap || !neutralEnvMap`) was written
  // assuming a NEW renderer object is the only way these caches go stale, so
  // it silently kept reusing `cachedGreenEnvMap`/`cachedNeutralEnvMap` —
  // PMREM render-target textures whose underlying GPU resource died with the
  // lost context — forever after. Three.js has no way to "repair" a texture
  // tied to a dead context; the visible result is exactly the reported bug:
  // Home's building renders flat, grey, and reflection-less (no IBL, no
  // window-glass panorama) after enough repeated navigation on mobile, and
  // never recovers without a full page reload. This listener drops the
  // stale references on loss and forces a fresh PMREM generation on
  // restore, against the NOW-functional same-identity renderer.
  useEffect(() => {
    const canvas = gl?.domElement;
    if (!canvas) return undefined;

    const handleContextLost = () => {
      cachedGl = null;
      cachedGreenEnvMap = null;
      cachedNeutralEnvMap = null;
    };

    const handleContextRestored = () => {
      logger.info(
        "[EnvironmentSetup] WebGL context restored — regenerating PMREM environment maps",
      );
      setContextGeneration((generation) => generation + 1);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
    };
  }, [gl]);

  // Continuous frame guard: enforces Home environment map, neutral tone mapping, and exposure
  useFrame(() => {
    if (!active) return;
    if (cachedNeutralEnvMap && rootScene.environment !== cachedNeutralEnvMap) {
      rootScene.environment = cachedNeutralEnvMap;
      rootScene.environmentIntensity = 1.0;
      rootScene.background = null;
    }
    if (rootScene.fog !== null) {
      rootScene.fog = null;
    }
    if (gl.toneMapping !== THREE.NeutralToneMapping) {
      gl.toneMapping = THREE.NeutralToneMapping;
      gl.needsUpdate = true;
    }
    const expectedExposure = Math.pow(2, HOME_EXPOSURE);
    if (gl.toneMappingExposure !== expectedExposure) {
      gl.toneMappingExposure = expectedExposure;
      gl.needsUpdate = true;
    }
  });

  useEffect(() => {
    if (!gl || !rootScene || !active) return;

    let greenEnvMap = cachedGreenEnvMap;
    let neutralEnvMap = cachedNeutralEnvMap;

    if (cachedGl !== gl || !greenEnvMap || !neutralEnvMap) {
      cachedGl = gl;
      const pmremGenerator = new THREE.PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();

      // 1. Generate 80m-nano-green.jpg PMREM map for window glass reflections
      if (panorama) {
        panorama.mapping = THREE.EquirectangularReflectionMapping;
        panorama.colorSpace = THREE.SRGBColorSpace;

        // Align this reflection panorama's horizontal orientation with the
        // panoramic dome baked into the GLB.
        const rotationY = environmentRotation?.[1] ?? 0;
        if (rotationY) {
          panorama.wrapS = THREE.RepeatWrapping;
          panorama.offset.x = rotationY / (2 * Math.PI);
        }

        panorama.needsUpdate = true;
        greenEnvMap = pmremGenerator.fromEquirectangular(panorama).texture;
        cachedGreenEnvMap = greenEnvMap;
      }

      // 2. Generate Neutral RoomEnvironment PMREM map for clean global IBL
      const roomEnv = new RoomEnvironment(gl);
      neutralEnvMap = pmremGenerator.fromScene(roomEnv).texture;
      cachedNeutralEnvMap = neutralEnvMap;
      roomEnv.dispose();
      pmremGenerator.dispose();
    }

    // Set global scene environment to neutral for clean 360° lighting
    rootScene.environment = neutralEnvMap;
    rootScene.environmentIntensity = 1.0;
    rootScene.background = null;
    if (rootScene.fog) rootScene.fog = null;
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = Math.pow(2, HOME_EXPOSURE);
    gl.needsUpdate = true;

    // Traverse ONLY newly-arrived top-level chunk roots of the home model
    // scene (not the whole merged group every run) so Inventory buildings
    // are never corrupted, and so a chunk arriving late doesn't force a
    // re-scan of every previously-processed building's glass materials —
    // see glassProcessedTopLevelNodes' own doc comment above.
    if (modelScene) {
      const clonedMaterialsCache = new Map();
      const newTopLevelNodes = modelScene.children.filter(
        (node) => !glassProcessedTopLevelNodes.has(node),
      );

      newTopLevelNodes.forEach((node) => {
        glassProcessedTopLevelNodes.add(node);

        node.traverse((child) => {
          if (!child.isMesh && !child.isInstancedMesh) return;
          const childName = child.name || "";
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach((material, index) => {
            if (!material) return;

            const materialName = material.name || "";
            const isExcludedGlassNode = GLASS_NODE_EXCLUSION_RE.test(childName);

            const isGlass =
              !isExcludedGlassNode &&
              (GLASS_MATERIALS_RE.test(materialName) ||
                GLASS_MATERIALS_RE.test(childName));

            if (isGlass) {
              const isPbr =
                material.isMeshStandardMaterial ||
                material.isMeshPhysicalMaterial;

              if (isPbr) {
                let targetMaterial = material;
                if (material.userData?.__isClonedByEnvSetup) {
                  material.envMap = greenEnvMap;
                  material.envMapIntensity = 1.2;
                  if (material.isMeshPhysicalMaterial) {
                    material.transmission = 0;
                    material.thickness = 0;
                  }
                  material.needsUpdate = true;
                } else {
                  if (clonedMaterialsCache.has(material)) {
                    targetMaterial = clonedMaterialsCache.get(material);
                  } else {
                    targetMaterial = material.clone();
                    targetMaterial.name = (material.name || "glass") + "_cloned";
                    targetMaterial.userData.__originalMaterial = material;
                    targetMaterial.userData.__isClonedByEnvSetup = true;

                    // Disable physical transmission so Three.js renders crisp PBR reflections
                    if (targetMaterial.isMeshPhysicalMaterial) {
                      targetMaterial.transmission = 0;
                      targetMaterial.thickness = 0;
                    }

                    // Window glass receives the 80m-nano-green panorama environment reflection
                    targetMaterial.envMap = greenEnvMap;
                    targetMaterial.envMapIntensity = 1.2;
                    targetMaterial.roughness = 0.05;
                    targetMaterial.metalness = 0.9;
                    targetMaterial.transparent = false;
                    targetMaterial.opacity = 1.0;
                    targetMaterial.color.set("#ffffff");
                    targetMaterial.needsUpdate = true;

                    clonedMaterialsCache.set(material, targetMaterial);
                  }

                  if (Array.isArray(child.material)) {
                    child.material[index] = targetMaterial;
                  } else {
                    child.material = targetMaterial;
                  }
                }
              }
            }
          });
        });
      });
    }

    invalidate();

    return () => {
      // Do not destroy scene materials or PMREM textures on route toggle
      // to ensure returning to Home from Inventory is instant and crash-free.
    };
    // contextGeneration is intentionally in this array despite never being
    // read in the body: bumping it after a webglcontextrestored event is
    // the ONLY way to force this effect to re-run when nothing else here
    // (gl's identity included) actually changed — see that listener's
    // comment above for why the `cachedGl !== gl` check alone can't do it.
  }, [
    gl,
    invalidate,
    panorama,
    rootScene,
    modelScene,
    modelVersion,
    environmentRotation,
    active,
    contextGeneration,
  ]);

  return null;
};

// Memoized: environmentRotation is a stable, empty-deps useMemo array from
// HomeScene, so this bails out of re-rendering whenever HomeSceneImpl does
// for a reason unrelated to this component (e.g. the isMobile breakpoint
// crossing) — same pattern already used for HomeScene/CameraRig/BuildingMarkers.
export default memo(EnvironmentSetup);
