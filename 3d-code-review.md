# 3D Web Experience — Code Review & Audit

This review cross-references the current codebase against the **[3D Web Experience Skill](file:///Users/niravpatel/Documents/Utsav%20Workspace/crprus-3d/.agents/skills/3d-web-experience/SKILL.md)** and the project's **SOP standard**.

## 🔴 Critical Recommendations

### 1. Missing Loading Feedback (Anti-Pattern: "No Loading State")

The project hides key UI components until `useProgress` reaches 100%, but leaves the user with a blank dark screen during initialization.

- **Requirement**: Implement a premium, branded loading screen that provides visual progress feedback.
- **Reference**: _SKILL.md § Anti-Patterns_ — "Users think it's broken... Bad first impression."

### 2. High Memory Usage: Material Proliferation

In `use-building.js` (Line 93), a `new THREE.MeshBasicMaterial` is created for **every single hitbox mesh** in the building. For complex buildings, this results in hundreds of draw calls and material switches.

- **Recommended Change**: Implement a **Shared Material Pool**. Use only 6 shared materials (Available: Base/Hover/Selected, Sold: Base/Hover/Selected) and swap them on the meshes.
- **Benefit**: Drastic reduction in GPU memory overhead and faster scene initialization.

## 🟡 Performance Optimizations

### 3. Side Orientation Performance

The hitboxes currently use `side: THREE.DoubleSide` (Line 82).

- **Optimization**: If the hitbox meshes are closed volumes, change to `THREE.FrontSide`. DoubleSided rendering essentially doubles the primitive count for the GPU.
- **Reference**: _WebGL Optimization capabilities_.

### 4. Visibility Toggling vs. Mounting

The current pattern in `BuildingInstance` (Line 88) uses `{active && <primitive object={glassScene} />}`.

- **Insight**: Toggling `visible={active}` on the primitive instead of conditional mounting might prevent minor frame drops when switching buildings, as the geometry remains in the GPU buffer.

## 🟢 Architecture & Patterns

### 5. Shortest Path Logic (Pattern: "Interactive 3D Scenes")

The azimuth rotation logic in `use-building.js` (Line 155) is **EXCELLENT**. It correctly uses `atan2(sin, cos)` to find the shortest path between angles, preventing the camera from "spinning the long way" around. This is a high-level interactive pattern.

### 6. Module-Level Vector Reuse

The use of module-level `_Y_AXIS`, `_hitPoint`, etc. (Line 23) shows great technical maturity and adheres to the _Performance Optimization_ guidelines in the skill.

---

## Next Steps — Implementation Plan

> [!IMPORTANT]
> I recommend starting with the **Material Pool** and **Loading Screen** as they provide the highest impact on both user experience and technical quality.

**Would you like me to start with the Material Pool optimization to reduce memory overhead?**
