import * as THREE from "three";
// ── HDR Environment ────────────────────────────────────────────────────────────
export const HDR_URL = "/hdr/san_bridge_2k.hdr";
// ── Camera ─────────────────────────────────────────────────────────────────────
export const CAMERA_POSITION = [0, 10, 60];
export const CAMERA_CONFIG = {
  fov: 35,
  near: 0.5,
  far: 2000,
};
// ── Canvas GL ──────────────────────────────────────────────────────────────────

// ── Grid ───────────────────────────────────────────────────────────────────────
export const GRID_CONFIG = {
  position: [0, 0.01, 0],
  args: [100, 100],
  cellSize: 2,
  cellThickness: 0,
  sectionSize: 10,
  sectionThickness: 0.9,
  sectionColor: "#ffffff",
  fadeDistance: 200,
  fadeStrength: 1,
  followCamera: false,
  infiniteGrid: true,
  renderOrder: 1,
};
