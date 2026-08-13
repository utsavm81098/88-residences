import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { configureLoader } from "@/utils/preloader";
import { HOME_MODEL_PATH } from "@/utils/constant";

// Ground overlay/decal materials that lie co-planar on top of base terrain
const DECAL_MAT_RE =
  /crossing_path|patch_grass|off_road|road_proj|inner_road|aya_road|fance_line|plane__block|plane__marble|plane__west|blocks_pool_side/i;

// White road lines & markings painted directly on top of road surfaces
const ROAD_LINE_MAT_RE =
  /roads?_line|line_mesh|loine_mesh|roads?_mesh|park_line|whitye|material__3472|material__3048|adskmatwhite|white.*line/i;

// Rooftop solar-panel nodes ("Solar_402", "SOL-D_147"). Their two materials
// ("M_11___Default", "Material__3218" — verified via the GLB JSON chunk to be
// used exclusively by these nodes) are authored at roughnessFactor 0.1 /
// metallicFactor 0.8, i.e. near-mirror. That, combined with scene.environment's
// RoomEnvironment IBL (whose "neutral" PMREM is literally a lit room containing
// several bright box-shaped area-light meshes — see three's RoomEnvironment.js)
// and the single hardcoded sun directionalLight in scene-lights.jsx, produced two
// glaring hotspots on every roof: a sharp circular highlight (the sun's punctual
// specular reflecting off a near-zero-roughness surface) and a sharp square
// highlight (one of RoomEnvironment's box lights reflecting via the IBL). Real
// anti-reflective solar glass is not a mirror, so roughness is raised and
// envMapIntensity capped here — same by-name material tuning pattern as
// Gray_BUILD/leaf-cutout above — to spread both hotspots into a soft sheen
// instead of two sharp geometric glare shapes.
const SOLAR_PANEL_NODE_RE = /^solar_|^sol-d/i;

// Volumetric round-crown mango trees ("MANGO_tree_03", etc.).
// Unlike flat billboard leaf cards, these are multi-directional meshes whose
// canopy relies on IBL bounce to fill self-shadowed leaf clusters. They are
// exempted from the leaf-cutout roughness floor below, so their GLB-authored
// material is preserved untouched.
const MANGO_TREE_NODE_RE = /^MANGO_tree/i;

// Floor applied to leaf-cutout materials' roughness (see isLeafCutout below).
// Below this, scene.environment's IBL produces a narrow, sharp specular lobe
// on flat double-sided leaf cards that visibly shifts as the camera orbits —
// verified against the GLB: 18 of 22 leaf materials already carry an authored
// roughness of 0.6-0.98, safely wide/soft, and are left untouched by this
// floor; only 3 (authored at 0.2) actually get raised.
const LEAF_SPECULAR_ROUGHNESS_FLOOR = 0.5;

// Cap on how many embedded KTX2 mip levels leaf-cutout materials are allowed
// to use (see the compressed-mip-chain fix in the texture-tuning loop below).
// Deeper levels bleed dark fringing from non-premultiplied alpha; levels 0-1
// (a single 2x2-texel box-filter step) were verified clean at the exact
// node/pixel a live regression appeared on, with the full chain reproducing
// it and this cap eliminating it.
const LEAF_CUTOUT_MAX_MIP_LEVELS = 2;

// Balcony glass railing panels ("Obj_RAILING - 017_60", etc.).
// The GLB authors used KHR_materials_transmission (physical glass, transmission=1)
// which the GLTF editor renders as completely invisible see-through glass.
// Three.js MeshPhysicalMaterial with transmission > 0 requires a dedicated
// transmission render target (a pre-rendered background texture sampled behind
// the glass). Without it, Three.js renders the mesh as a dark/black opaque slab.
// Fix: detect transmission > 0, zero it out, switch to standard alpha-blend at
// near-zero opacity (0.05) to match the "essentially invisible" GLTF editor look.
// Roughness, metalness, and color are NOT touched — they come from the GLB.
const RAILING_NODE_RE = /^Obj_RAILING/i;

export const useHomeScene = () => {
  const { scene } = useGLTF(HOME_MODEL_PATH, true, true, configureLoader);
  const gl = useThree((state) => state.gl);
  const maxAnisotropy = useMemo(
    () =>
      gl?.capabilities ? Math.min(gl.capabilities.getMaxAnisotropy(), 16) : 16,
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

      // Compute node-level flags once — these are based on child.name which is
      // constant across all materials of this mesh.
      const isRailing = RAILING_NODE_RE.test(child.name || "");

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

        // Road lines & white markings: painted directly on top of asphalt/ground decals.
        // Apply stronger negative polygonOffset (-2.5) and renderOrder (2) so WebGL depth
        // testing deterministically places them above asphalt without Z-fighting or clipping.
        const isRoadLine =
          ROAD_LINE_MAT_RE.test(material.name || "") ||
          ROAD_LINE_MAT_RE.test(child.name || "");

        if (isRoadLine) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = -2.5;
          material.polygonOffsetUnits = -2.5;
          material.depthWrite = true;
          material.depthTest = true;
          child.renderOrder = 2;
          material.needsUpdate = true;
        }

        // Apply polygonOffset to co-planar ground overlays/road decals so WebGL draws them
        // slightly above base terrain without any Z-fighting/flickering
        const isDecal =
          DECAL_MAT_RE.test(material.name || "") ||
          DECAL_MAT_RE.test(child.name || "");

        if (isDecal && !isRoadLine) {
          material.polygonOffset = true;
          material.polygonOffsetFactor = -1;
          material.polygonOffsetUnits = -1;
          child.renderOrder = 1;
          material.needsUpdate = true;
        }

        // Rooftop solar panels: soften the near-mirror GLB material (roughness
        // 0.1 / metalness 0.8) so the sun's specular highlight and the
        // RoomEnvironment IBL's box-light reflections spread into a soft sheen
        // instead of rendering as a sharp circle + square glare on every roof.
        const isSolarPanel = SOLAR_PANEL_NODE_RE.test(child.name || "");

        if (isSolarPanel) {
          material.roughness = Math.max(material.roughness ?? 0, 0.45);
          material.envMapIntensity = 0.35;
          material.needsUpdate = true;
        }

        // Balcony glass railing panels: the GLB uses KHR_materials_transmission
        // (physical glass) which the GLTF editor renders as completely invisible.
        // Three.js cannot render physical transmission without a dedicated render
        // target — it outputs a dark opaque slab instead. Convert to standard
        // alpha-blend at near-zero opacity to match the invisible-glass appearance.
        // Roughness, metalness, and color come 100% from the GLB.
        if (
          isRailing &&
          (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)
        ) {
          // Disable physical transmission — Three.js needs a transmission render
          // target to process it; without one the surface renders pitch-black.
          if (
            material.isMeshPhysicalMaterial &&
            (material.transmission ?? 0) > 0
          ) {
            material.transmission = 0;
            material.thickness = 0;
          }
          // Semi-transparent frosted glass: matches the milky, partially see-through
          // panels visible in the GLTF editor reference. ~65% transparent.
          material.transparent = true;
          material.opacity = 0.4;
          material.depthWrite = false; // don't occlude geometry behind the panel
          material.side = THREE.DoubleSide; // visible from inside + outside balcony
          material.needsUpdate = true;
        }

        // Store original GLB alphaTest on first inspection to guarantee clean reset
        if (material.userData.__glbAlphaTest === undefined) {
          material.userData.__glbAlphaTest = material.alphaTest;
        } else {
          material.alphaTest = material.userData.__glbAlphaTest;
        }

        // Target leaf cutout materials (materials with alphaTest / alphaCutoff > 0 in GLB).
        // Railing nodes are explicitly excluded: they have their own transparent-glass
        // treatment above and must NOT receive the foliage overrides (alphaToCoverage +
        // the roughness floor below would break the glass look).
        const isLeafCutout =
          (material.alphaTest > 0 || material.alphaMap) &&
          !material.name.toLowerCase().includes("glass") &&
          !isRailing;

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
          // puts a specular highlight on flat, double-sided leaf cards. On a LOW-roughness
          // material that highlight is a narrow, sharp lobe that visibly shifts/pops as the
          // camera orbits — that's the foliage "flickering" this used to fix by zeroing
          // envMapIntensity on every leaf material outright. Verified against the GLB
          // (22 leaf-cutout materials, parsed from the glTF JSON): 18 of them already carry
          // an authored roughness of 0.6-0.98 (or the glTF default of 1), where the specular
          // lobe is already wide/soft and doesn't shimmer — zeroing envMapIntensity on those
          // was an overcorrection that just made most trees read flat/matte instead of lit.
          // Only 3 materials (M_02___Default, Mangrove_leafs, adskMat04) are authored at a
          // shimmer-risk 0.2. Fix targets those specifically, the same by-roughness lever
          // already used on solar panels above, instead of killing lighting response scene-wide.
          // Exception: volumetric mango trees need IBL bounce to fill their dense
          // multi-directional canopy — without it they collapse to a dark silhouette.
          const isMango = MANGO_TREE_NODE_RE.test(child.name || "");
          if (!isMango && material.roughness !== undefined) {
            material.roughness = Math.max(
              material.roughness,
              LEAF_SPECULAR_ROUGHNESS_FLOOR,
            );
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
          texture.magFilter = THREE.LinearFilter;

          // ROOT CAUSE OF THE SCENE-WIDE SHIMMER/FLICKER WHILE ORBITING (fixed
          // here): every texture in this GLB (all 340 — trees, all 7 building
          // facades, wood railings like "D -RAILING -WOOD") is KTX2/Basis-
          // compressed and DOES ship a full embedded mip chain (verified by
          // parsing the KTX2 containers: 10-12 levels each, matching
          // log2(size)+1 for their 512-2048px textures). But every one of them
          // is also assigned the model's single shared glTF sampler, exported
          // with minFilter=LINEAR (no mip). GLTFLoader.loadTextureImage
          // unconditionally re-applies that sampler's minFilter on top of
          // whatever KTX2Loader set, clobbering KTX2Loader's own correct
          // LinearMipmapLinearFilter default back down to LinearFilter. The
          // net effect: every surface in the scene sampled mip level 0 (full
          // resolution) only, at every distance and every grazing angle —
          // textbook minification aliasing, which reads as per-frame noise
          // ("shimmer") as the camera orbits and the sampled texel shifts.
          //
          // The non-compressed branch below already fixes this by asking
          // three/WebGL to GENERATE mips — which is correct there, but is not
          // a valid operation for GPU-compressed formats and is why compressed
          // textures were excluded entirely. They don't need generating,
          // though: three.js already uploads every level in a KTX2 texture's
          // `.mipmaps` array to the GPU regardless of minFilter (see
          // WebGLTextures.js uploadTexture) — the chain sits there unused. All
          // that's missing is telling the sampler to actually read it.
          // EXCEPTION — alpha-cutout foliage sprites (isLeafCutout, computed
          // above) get a CAPPED version of the fix below, not the full chain.
          // Verified live by raycasting the exact screen pixel of a regression
          // a production review caught (a dark diagonal streak cutting across
          // a shrub card near building B): the hit resolved to node
          // "058_029_28", material "pngaaa_com_2004453" — an isLeafCutout
          // material. Its embedded KTX2 mip chain bleeds dark fringing along
          // the leaf silhouette at deep levels (the classic non-premultiplied-
          // alpha mip-generation artifact: transparent pixels are usually
          // stored with black RGB, and box-filtering RGB+alpha together at
          // each mip level blends that black into the visible edge — the
          // deeper the level, the larger the averaged neighborhood, the more
          // background bleeds in). Levels 0-1 only average a 2x2 texel
          // neighborhood — the smallest possible step — and were verified
          // clean at the exact node/pixel the streak appeared on, at the
          // exact same camera framing, with the full chain re-enabled
          // reproducing the streak and this 2-level cap eliminating it.
          // Capping (not excluding outright) still measurably narrows the
          // minification-aliasing window meant to be re-verified live before
          // trusting these level-0-only textures: distant leaf cards up to
          // ~2x further away than the untruncated fix's safe range now get at
          // least one round of mip blending instead of raw mip-0 aliasing.
          const hasEmbeddedMipChain =
            texture.isCompressedTexture && texture.mipmaps?.length > 1;

          if (
            !texture.isCompressedTexture &&
            (texture.minFilter === THREE.LinearFilter ||
              texture.minFilter === THREE.NearestFilter)
          ) {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.generateMipmaps = true;
          } else if (
            hasEmbeddedMipChain &&
            texture.minFilter !== THREE.LinearMipmapLinearFilter
          ) {
            if (
              isLeafCutout &&
              texture.mipmaps.length > LEAF_CUTOUT_MAX_MIP_LEVELS
            ) {
              texture.mipmaps = texture.mipmaps.slice(
                0,
                LEAF_CUTOUT_MAX_MIP_LEVELS,
              );
            }
            // Do NOT set generateMipmaps here — the chain is already
            // embedded/uploaded; asking three to generate one for a
            // compressed format is unsupported and unnecessary.
            texture.minFilter = THREE.LinearMipmapLinearFilter;
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
