---
trigger: always_on
glob:
  - "src/**"
description: Enforce project folder structure and architectural boundaries per SOP §4, §12
---

# Architecture Rules (SOP §4, §12)

## Folder Structure

The project MUST follow this folder structure inside `src/`:

```
src/
├── assets/                    # Static assets (images, icons, fonts, 3D models)
│   └── icons/
│
├── components/                # Pure UI components (NO business logic, NO API calls)
│   └── ui/                    # shadcn/ui primitives (Button, Accordion, Carousel, Tabs, etc.)
│
├── containers/                # Smart components — connect business logic to UI
│                              # Each container has a hook (use-<name>.js) and an index.jsx
│
├── features/                  # ⚡ PROJECT EXCEPTION: 3D scene feature modules
│                              # These are R3F components that MUST run inside <Canvas>.
│                              # They follow the container pattern internally:
│                              #   index.jsx = render component
│                              #   use-<feature>.js = all logic, state, effects
│
├── hooks/                     # Global reusable hooks (not tied to a specific feature)
│
├── layouts/                   # Application-level layout components (if needed)
│
├── lib/                       # Framework utilities (cn(), etc.)
│
├── store/                     # Redux Toolkit store
│   ├── index.js               # configureStore
│   └── slices/                # One slice per domain concern
│       ├── index.js           # combineReducers / aggregator
│       ├── building-slice.js
│       ├── tooltip-slice.js
│       └── drag-slice.js
│
├── utils/                     # Helper functions, constants, and utility logic
│   ├── constant.js            # App-wide constants (BUILDING_CONFIG, unitData, etc.)
│   ├── config.js              # Camera defaults, Canvas GL config, Grid config
│   └── helper.js              # Pure utility functions
│
├── config/                    # Environment and app configuration
│
├── App.jsx                    # Root layout
├── App.css                    # Global CSS
├── index.css                  # Tailwind directives + CSS custom properties
└── main.jsx                   # Entry point
```

### Current → Target Migration Map

| Current Path | Target Path | Action |
|---|---|---|
| `src/redux/` | `src/store/` | Rename folder |
| `src/redux/reducers/` | `src/store/slices/` | Rename folder |
| `src/redux/reducers/buildingSlice.js` | `src/store/slices/building-slice.js` | Rename file |
| `src/redux/reducers/tooltipSlice.js` | `src/store/slices/tooltip-slice.js` | Rename file |
| `src/redux/reducers/dragSlice.js` | `src/store/slices/drag-slice.js` | Rename file |
| `src/hooks/useResponsiveConfig.js` | `src/hooks/use-responsive-config.js` | Rename file |

## Architectural Boundaries

### The Golden Rules (SOP §12)

1. **UI components (`/components`) must NOT:**
   - Access Redux store directly (no `useSelector`, no `useDispatch`)
   - Contain business logic
   - Make API calls
   - Import container hooks

2. **Containers (`/containers`) MUST:**
   - Connect business logic to UI via hooks
   - Pass prepared data to UI components via props
   - Handle lifecycle events
   - Have a single container hook as entry point

3. **Features (`/features`) — Project Exception:**
   - 3D features use R3F hooks (`useThree`, `useFrame`, `useGLTF`) that MUST run inside `<Canvas>`
   - They follow the container pattern internally: `index.jsx` (render) + `use-<name>.js` (logic)
   - Direct Redux access is allowed in feature hooks since they cannot be separated into a container layer above `<Canvas>`

4. **Store (`/store`) MUST:**
   - Contain only global-level slices (cross-application concerns)
   - Feature-specific state goes in the feature's own hook
   - All slices must be imported in `slices/index.js`

5. **Hooks (`/hooks`) MUST:**
   - Be generic and reusable
   - Not depend on a specific page or feature
   - Return data and handlers, never JSX

6. **Pages MUST:**
   - Only render containers
   - Contain no business logic
   - (Note: This project currently has no pages/routes — single-page 3D viewer)

## Rules for New Code

When creating new files:
- Choose the correct directory based on the rules above
- Ask: "Does this component access the store?" → If yes, it's a container, not a component
- Ask: "Is this hook feature-specific?" → If yes, co-locate with the feature
- Ask: "Is this a pure UI building block?" → If yes, it goes in `/components`
