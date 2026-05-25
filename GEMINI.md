# 88Residences — Architecture Reference

> Interactive 3D real-estate building viewer with unit selection, camera controls, and responsive mobile/desktop layouts.

---

## Tech Stack

| Layer               | Technology                            | Version            |
| ------------------- | ------------------------------------- | ------------------ |
| **Framework**       | React (Vite)                          | 19.2.3             |
| **3D Engine**       | Three.js + React Three Fiber + Drei   | 0.172 / 9.5 / 10.7 |
| **State**           | Redux Toolkit + react-redux           | 2.11.2 / 9.2       |
| **Animations**      | GSAP                                  | 3.12.7             |
| **Styling**         | Tailwind CSS 3 + shadcn/ui primitives | 3.4.19             |
| **Post-processing** | @react-three/postprocessing (SMAA)    | 3.0.4              |
| **UI Icons**        | @tabler/icons-react                   | 3.41.1             |
| **Carousel**        | embla-carousel-react                  | 8.6.0              |

---

## Directory Structure

```
src/
├── main.jsx                    # Entry point — wraps <AppProviders> in Redux <Provider>
├── app.jsx                     # Root application wrapper setting up Providers and React Router
├── app.css                     # Global scrollbar styles and basic configurations
├── index.css                   # Tailwind directives + CSS custom properties (shadcn variables)
│
├── auth/                       # Authentication context, provider, and use-auth hook
│   ├── context.jsx             # Auth Context creation
│   ├── provider.jsx            # Auth state provider
│   ├── use-auth.js             # custom useAuth hook
│   └── index.js                # Auth entry exports
│
├── i18n/                       # Localization & internationalization config
│   └── index.js                # i18next configuration with fallback languages and detector
│
├── routes/                     # Central client routing definition
│   ├── index.jsx               # createBrowserRouter, language guards, and layout matching
│   └── routes.js               # Route paths definition constants
│
├── layouts/                    # Global app layouts
│   └── main-layout/            # Renders responsive SidebarNav/MobileNav layouts around pages
│
├── pages/                      # Target routing page components
│   ├── home/                   # "Coming Soon" splash page
│   └── inventory/              # Core 3D Viewer page (renders Canvas, Sidebar, and Top Nav)
│
├── features/                   # R3F scene graph feature modules (run inside <Canvas>)
│   ├── scene-environment/      # Scene settings: lighting, shadows, cube-map backdrop
│   ├── building/               # Dual-GLB building loader, hitboxes parsing, pointer interaction
│   ├── building-tooltip/       # 3D interactive unit hover tooltip configuration
│   ├── adaptive-controls/      # OrbitControls wrapper adjusting min/max distance dynamically
│   └── direction-label/        # N/S/E/W floating billboards with rotate-to-face camera action
│
├── containers/                 # Smart UI components (connect Redux store/APIs to pure UI)
│   ├── top-navigation/         # Header containing language selector and reset camera action
│   ├── sidebar-panel/          # Sidebar drawer hosting filters or selected unit card
│   ├── inventory-sidebar/      # Unit list and search panels inside the sidebar
│   ├── unit-info-card/         # Informational sheet for selected apartments
│   ├── mobile-menu/            # GSAP-driven swipeable bottom drawer with snap points
│   ├── mobile-nav/             # Bottom navigation pill buttons for mobile viewports
│   ├── sidebar-nav/            # Navigation rail rail bar for desktop screens
│   ├── enquiry-dialog/         # Interactive booking form popup modal
│   └── filter-overlay/         # Overlay filters for inventory searching
│
├── components/                 # Pure presentational components (no store or API imports)
│   ├── error-boundary/         # Global/Component error boundary fallbacks and logging
│   ├── providers/              # Generic hooks/state provider layers (e.g. QueryProvider)
│   └── ui/                     # shadcn/ui and custom primitives (accordion, button, dialog, etc.)
│
├── store/                      # Global Redux State (Redux Toolkit)
│   ├── index.js                # configureStore aggregator
│   └── slices/
│       ├── index.js            # combineReducers (building + tooltip + drag slices)
│       ├── building-slice.js   # Active building, selection, snap-points, menu toggle actions
│       ├── tooltip-slice.js    # Hover tooltip positioning and unit details
│       └── drag-slice.js       # OrbitControls drag status flags (silences tooltips during pans)
│
├── services/                   # Network and API integration
│   ├── api-client.js           # Customized Axios instance with base prefix configuration
│   └── index.js                # Service modules (e.g. inventory APIs)
│
├── hooks/                      # Global reusable hooks
│   ├── use-mobile.js           # Breakpoint matches detection
│   ├── use-responsive-config.js# Responsively computes camera focal configuration values
│   └── use-api-query.js        # Dynamic API fetching hook integrations
│
├── utils/                      # Helper libraries and application constants
│   ├── constant.js             # Building models presets, statuses, base colors mapping
│   ├── app-constants.js        # Global static parameters definitions
│   ├── filter-helper.js        # Inventory filtering logic algorithms
│   ├── helper.js               # Helper algorithms (languages translation, flattening array maps)
│   ├── preloader.js            # Singleton loaders cache configurations (Draco, KTX2, basis)
│   └── logger.js               # Centralized environment-aware debugger loggers
│
└── lib/                        # Common utilities wrapper
    └── utils.js                # cn() - Classnames merger utility (clsx + tailwind-merge)
```

### SOP Compliance Notes

The following rules are enforced by `.agents/rules/` — see each rule file for full details:

- **Architecture** (`.agents/rules/architecture.md`): Folder structure, container/UI separation, 3D features exception
- **Coding Standards** (`.agents/rules/coding-standards.md`): kebab-case files, PascalCase components, formatting
- **State Management** (`.agents/rules/state-management.md`): Redux Toolkit patterns, slice organization
- **Component Guidelines** (`.agents/rules/component-guidelines.md`): Three-layer architecture, Golden Rules
- **Hooks** (`.agents/rules/hooks-guidelines.md`): No JSX, return `{ data, handlers }`, one per file
- **Error Handling** (`.agents/rules/error-handling.md`): Error Boundary, centralized logger, no raw `console.log`
- **Performance** (`.agents/rules/performance.md`): Memoization, lazy loading, 3D optimizations
- **Security** (`.agents/rules/security.md`): No XSS, env var management, API protection
- **Styling** (`.agents/rules/styling-theming.md`): Design tokens, Tailwind-only, `cn()` utility
- **Testing** (`.agents/rules/testing-standards.md`): Vitest, behavior-driven tests, coverage targets

---

---

## Data Flow & State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Redux Store                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ building                                         │   │
│  │  ├── currentBuildingIndex: number                │   │
│  │  ├── currentBuilding: BUILDING_CONFIG[i]         │   │
│  │  ├── isMenuOpen: boolean                         │   │
│  │  ├── selectedUnit: { name, status, type,         │   │
│  │  │                   area, price, floor,         │   │
│  │  │                   direction } | null          │   │
│  │  └── snap: { height, snapIndex }                 │   │
│  │        snapIndex: 0=collapsed, 1=half, 2=full    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ tooltip                                          │   │
│  │  ├── visible: boolean                            │   │
│  │  ├── unit: object | null                         │   │
│  │  └── x, y: number (pointer coords)               │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ drag                                             │   │
│  │  └── isDragging: boolean                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Actions

| Action                           | Dispatched From                                     | Effect                                           |
| -------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `nextBuilding` / `prevBuilding`  | TopNavigation                                       | Cycles through BUILDING_CONFIG, clears selection |
| `setBuilding(index)`             | TopNavigation dropdown                              | Jumps to specific building                       |
| `setSelectedUnit(unit)`          | Sidebar row click / 3D model click / Carousel slide | Triggers highlight + camera focus                |
| `clearSelectedUnit()`            | Close button / reset                                | Reverts all 3D highlights                        |
| `setSnap({ height, snapIndex })` | MobileMenu animateTo()                              | Drives canvas height + bottom sheet position     |
| `resetBuilding()`                | Reset button                                        | Resets everything to initial state               |
| `showTooltip` / `hideTooltip`    | use-building.js pointer handlers                    | Desktop hover tooltip                            |
| `setDragging(bool)`              | AdaptiveControls onStart/onEnd                      | Suppresses tooltips during orbit                 |

---

## 3D Scene Architecture

```
<Canvas>
  ├── <CameraStabilizer />         ← Mobile only: FOV compensation
  └── <SceneEnvironment>           ← Camera, lights, HDR, grid, post-processing
        ├── <PerspectiveCamera>    ← fov=35, position from use-responsive-config
        ├── <directionalLight>     ← Primary sun light
        ├── <directionalLight>     ← Fill light (Type D only)
        ├── <Environment>          ← HDR / preset per building
        ├── <ambientLight>
        ├── <Grid>                 ← Infinite ground grid
        ├── <Building>             ← All 5 buildings pre-loaded, visibility toggled
        │     └── <BuildingInstance> (×5)
        │           ├── <primitive object={buildingScene}>   ← Opaque GLB model
        │           └── <primitive object={glassScene}>      ← Transparent hitboxes
        ├── <AdaptiveControls>     ← OrbitControls with responsive limits
        ├── <DirectionLabel>       ← N/S/E/W billboard text
        └── <EffectComposer>       ← SMAA anti-aliasing
```

### Building Model System (Dual-GLB Pattern)

Each building type uses **two separate GLB files**:

1. **Model GLB** (`type-f.glb`) — The visually detailed opaque building
2. **Hitbox GLB** (`type-f-hitbox.glb`) — Transparent glass overlay meshes named to match unit data (e.g., `Box001`, `Line002`)

The **hitbox meshes** are the interactive layer:

- Each mesh gets a `MeshBasicMaterial` (transparent, lighting-independent)
- Color/opacity driven by unit status (`available` → blue, `sold` → gray/red)
- `EdgesGeometry` + `LineSegments` added as children for white border outlines
- All color state stored in `mesh.userData` for pointer handler access

### All 5 buildings are pre-loaded and kept in the scene graph

Only the `active` building's group has `visible={true}`. This eliminates loading flicker when switching buildings — the GPU already has all geometry buffered.

---

## Interaction Pipeline

### Desktop Flow

```
User hovers 3D unit
  → handlePointerOver (use-building.js)
    → GSAP animates mesh color/opacity to hover state
    → dispatch(showTooltip) with pointer coords
    → Tooltip follows cursor via handlePointerMove

User clicks 3D unit (or sidebar row)
  → handleClick → dispatch(setSelectedUnit)
    → useEffect triggers updateUnitColor()
      → All meshes reset to base, selected mesh → selected color
      → focusCameraOnMesh() — GSAP azimuthal camera rotation to face the unit
    → BuildingTooltip renders UnitInfoCard in top-right popup
```

### Mobile Flow

```
User taps 3D unit
  → dispatch(setSelectedUnit)
    → MobileMenu useEffect detects selectedUnit change
      → Scrolls Embla carousel to matching unit card
      → If snapIndex !== 1, calls animateTo(1) to open bottom sheet
    → pages/inventory/index.jsx canvas height shrinks via CSS calc()
    → CameraStabilizer compensates FOV to prevent zoom jump
```

---

## Camera System

### Responsive Config (`use-responsive-config.js`)

| Breakpoint         | cameraZ | orbit.min | orbit.max |
| ------------------ | ------- | --------- | --------- |
| Mobile (< 768px)   | 120     | 80        | 140       |
| Tablet (< 1024px)  | 85      | 60        | 120       |
| Desktop (≥ 1024px) | 60      | 60        | 90        |

### Camera Stabilizer (Mobile Only)

**Problem:** When the bottom sheet opens, the canvas container height shrinks. Three.js auto-updates `camera.aspect` and calls `updateProjectionMatrix()`, which changes the visual zoom level.

**Solution:** `CameraStabilizer` runs in `useFrame` and adjusts the camera FOV proportionally:

```
newFOV = 2 × atan(tan(baseFOV/2) × (currentHeight / fullHeight))
```

This keeps the building at the exact same on-screen size regardless of canvas height.

### Camera Focus Animation (`focusCameraOnMesh`)

When a unit is selected, GSAP animates the camera's **azimuthal angle** around the orbit target to face the selected unit. Uses shortest-path angle wrapping via `atan2(sin, cos)` to prevent 270° rotations.

---

## Mobile Bottom Sheet (`mobile-menu.jsx`)

### Snap Points (Pixel Heights)

| Index | Height          | Description                                            |
| ----- | --------------- | ------------------------------------------------------ |
| 0     | 85px            | Collapsed — shows only the drag handle + building name |
| 1     | 40% viewport    | Half — shows carousel with apartment cards             |
| 2     | viewport − 80px | Full — scrollable inventory list                       |

### Gesture System

- Touch/mouse drag with **direction lock**: first 5px of movement determines vertical vs horizontal
- Horizontal swipes pass through to Embla carousel (no interference)
- Vertical swipes control sheet height via `gsap.set()` during drag, `gsap.to()` on release
- On release: snaps to closest snap point via distance calculation

### Redux Sync

```
animateTo(index)
  → dispatch(setSnap({ height: snapPoints[index], snapIndex: index }))
  → gsap.to(sheetRef, { height: snapPoints[index] })
  → pages/inventory/index.jsx reads snap.height and adjusts canvas container height
```

---

## Styling Architecture

- **Tailwind CSS 3** with shadcn/ui CSS custom properties (`--background`, `--border`, etc.)
- **Dark mode** is the only mode (bg `#050505`, sidebar `#1f2530`)
- **Font**: Open Sans (Google Font) loaded via index.html
- **shadcn primitives**: Accordion, Button, Carousel, Tabs (Radix-based)
- **Utility function**: `cn()` = `twMerge(clsx(...))` for conditional class merging

---

## Build & Dev Commands

```bash
npm run dev          # Vite dev server (development mode)
npm run staging      # Vite dev server (staging mode)
npm run production   # Vite dev server (production mode)
npm run build        # Production build (vite build --mode production)
npm run build:staging # Staging build
```

---

## Performance Optimizations

1. **All GLB models preloaded** — `useGLTF.preload()` and `useEnvironment.preload()` called at module level
2. **Visibility toggling** over mount/unmount — all 5 buildings stay in scene graph, only `visible` toggles
3. **Reusable Three.js vectors** — `_Y_AXIS`, `_hitPoint`, `_dir`, `_temp` are module-level to avoid GC pressure
4. **Memoized scenes** — `buildingScene` and `glassScene` cloned once via `useMemo`
5. **Adaptive DPR** — `AdaptiveDpr` + `PerformanceMonitor` auto-downgrades resolution on slow devices
6. **GSAP `killTweensOf()`** — All color animations kill previous tweens to prevent accumulation
7. **CameraStabilizer** — Only updates projection matrix when FOV change exceeds 0.05° threshold
8. **Canvas `frameloop="always"`** — Continuous render for smooth OrbitControls damping

---

## Building Configuration

Buildings are defined in `BUILDING_CONFIG[]` (constant.js):

| Name   | Model           | Hitbox            | Environment     | Custom Lighting         |
| ------ | --------------- | ----------------- | --------------- | ----------------------- |
| Type F | type-f.glb      | type-f-hitbox.glb | preset: city    | Default                 |
| Type D | type-d-1024.glb | d-hitbox.glb      | HDR: kloofendal | Custom (fill + ambient) |
| Type A | type-a-1024.glb | a-hitbox.glb      | preset: city    | Default                 |
| Type G | type-g.glb      | g-hitbox.glb      | preset: city    | Default                 |
| Type B | type-b.glb      | a-hitbox.glb      | preset: city    | Default                 |

Unit data is keyed by building name in `unitData{}`. Each unit has: `name`, `status`, `type`, `area`, `price`, `floor`, `direction`.

Unit status colors:

| Status    | Base      | Hover     | Selected  | Base Opacity | Hover Opacity | Selected Opacity |
| --------- | --------- | --------- | --------- | ------------ | ------------- | ---------------- |
| available | `#6B8EB5` | `#51A5F0` | `#3794EB` | 0.1          | 0.6           | 0.8              |
| sold      | `#D0D0D0` | `#F87171` | `#EF4444` | 0.1          | 0.5           | 0.7              |
