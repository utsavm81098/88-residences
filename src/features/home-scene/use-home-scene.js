import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { configureLoader } from "@/utils/preloader";
import { HOME_MODEL_PATH } from "@/utils/constant";

// Ground overlay/decal materials that lie co-planar on top of base terrain
const DECAL_MAT_RE =
  /crossing_path|patch_grass|off_road|road_proj|inner_road|aya_road|fance_line|plane__block|plane__marble|plane__west|blocks_pool_side/i;

export const useHomeScene = () => {
  const { scene } = useGLTF(HOME_MODEL_PATH, true, true, configureLoader);
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useMemo(
    () => (gl?.capabilities ? gl.capabilities.getMaxAnisotropy() : 8),
    [gl],
  );

  const tunedScene = useMemo(() => {
    scene.traverse((child) => {
      // Freeze per-object matrix updates — scene geometry never moves.
      child.matrixAutoUpdate = false;

      // NOTE: frustumCulled is intentionally left at its default (true for Mesh,
      // ignored for non-Mesh). Disabling it on all 318+ objects forces the GPU to
      // process every mesh even when off-screen during camera rotation — that was
      // the primary cause of per-frame lag. scene.updateMatrixWorld(true) below
      // ensures all bounding spheres are current, so frustum culling is safe.

      if (!child.isMesh && !child.isInstancedMesh) return;
      if (!child.material) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        if (!material) return;

        if (material.name === "Gray_BUILD") {
          material.transmission = 0;
          material.thickness = 0;
          material.transparent = false;
          material.opacity = 1;
          material.depthWrite = true;
          material.depthTest = true;
          material.side = THREE.FrontSide;
          material.polygonOffset = true;
          material.polygonOffsetFactor = 1;
          material.polygonOffsetUnits = 1;

          material.needsUpdate = true;
        }

        // Apply polygonOffset to co-planar ground overlays/road decals so WebGL draws them
        // slightly above base terrain without any Z-fighting/flickering
        const isDecal =
          DECAL_MAT_RE.test(material.name || "") ||
          DECAL_MAT_RE.test(child.name || "");

        if (isDecal) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -1;
          material.needsUpdate = true;
        }

        // Store original GLB alphaTest on first inspection to guarantee clean reset
        if (material.userData.__glbAlphaTest === undefined) {
          material.userData.__glbAlphaTest = material.alphaTest;
        } else {
          material.alphaTest = material.userData.__glbAlphaTest;
        }

        // Target leaf cutout materials (materials with alphaTest / alphaCutoff > 0 in GLB)
        const isLeafCutout =
          (material.alphaTest > 0 || material.alphaMap) &&
          !material.name.toLowerCase().includes("glass");

        if (isLeafCutout) {
          // DoubleSide ensures reverse faces of leaf planes render illuminated from all camera angles
          material.side = THREE.DoubleSide;

          // WebGL2 Alpha-to-Coverage converts continuous alpha values into MSAA sub-pixel sample masks,
          // preventing binary on/off fragment discard flickering during camera rotation
          material.alphaToCoverage = true;

          // Disable shadow casting on foliage leaf meshes to eliminate temporal shadow crawling noise
          // (flickering dark specks on trees) during camera movement/rotation
          child.castShadow = false;

          // Tree bases sit at the same Y as the grass/ground they're planted in, so their
          // card geometry is coplanar with the landscape at the trunk. Push leaf cards
          // slightly toward the camera so the depth test resolves deterministically instead
          // of alternating winner per-frame (z-fighting flicker) while orbiting. More
          // negative than the ground-decal offset (-1/-1) above so trees always win.
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1.2;
          material.polygonOffsetUnits = -1.2;

          // Leaf materials are lit (not KHR_materials_unlit), so scene.environment's IBL
          // otherwise puts a specular sheen on flat, double-sided leaf cards that shifts
          // continuously as they rotate through view, reading as foliage "flickering"
          // brightness. Foliage is meant to read as flat/diffuse, not reflective.
          if (material.envMapIntensity !== undefined) {
            material.envMapIntensity = 0;
          }

          material.needsUpdate = true;
        }

        // Apply anisotropy for crisp texture sampling across all slots, and restore
        // mipmapping wherever it's safe to do so.
        const TEXTURE_SLOTS = [
          "map",
          "alphaMap",
          "normalMap",
          "roughnessMap",
          "metalnessMap",
          "bumpMap",
          "aoMap",
          "emissiveMap",
        ];

        TEXTURE_SLOTS.forEach((slot) => {
          const texture = material[slot];
          if (!texture || texture.userData.__optimized) return;

          texture.anisotropy = maxAnisotropy;

          // The GLB's single texture sampler ships with LinearFilter (mipmaps disabled)
          // across every texture, which looks fine in a still close-up but aliases into
          // crawling diagonal stripes at distance/oblique angles while orbiting. Restore
          // trilinear mip filtering everywhere, including alpha-cutout foliage — GPU mip
          // generation on an alpha-cutout texture can in principle bleed the undefined RGB
          // under fully-transparent texels into edge texels at lower mips (black fringing
          // on leaf silhouettes), but this was live-tested against the leaf/branch atlases
          // this model actually ships (close-up and at distance, where the affected lower
          // mip levels are sampled) and no fringing appeared, so foliage is no longer
          // excluded. Skip already-mipped compressed (KTX2/Basis) textures, which don't
          // need this and can misbehave if forced.
          if (!texture.isCompressedTexture && texture.minFilter === THREE.LinearFilter) {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
          }

          texture.needsUpdate = true;
          texture.userData.__optimized = true;
        });
      });
    });

    scene.updateMatrixWorld(true);
    scene.matrixWorldAutoUpdate = false;

    return scene;
  }, [scene, maxAnisotropy]);

  return { scene: tunedScene };
};

export default useHomeScene;
