---
trigger: always_on
glob:
  - "src/**/*.{js,jsx,ts,tsx}"
description: Enforce file naming, code formatting, and coding conventions per SOP §5
---

# Coding Standards (SOP §5)

## File Naming — kebab-case

All source files MUST use **kebab-case** naming:

| Type | Convention | Example |
|---|---|---|
| Component file | `kebab-case.jsx` | `apartment-card.jsx`, `unit-info-card.jsx` |
| Hook file | `use-kebab-case.js` | `use-building.js`, `use-responsive-config.js` |
| Slice file | `kebab-case-slice.js` | `building-slice.js`, `tooltip-slice.js` |
| Utility file | `kebab-case.js` | `constant.js`, `helper.js`, `config.js` |
| Style file | `kebab-case.css` | `app.css`, `index.css` |
| Test file | `kebab-case.test.js` | `use-building.test.js` |

### ❌ NOT Allowed
```
useResponsiveConfig.js    →  use-responsive-config.js
buildingSlice.js          →  building-slice.js
tooltipSlice.js           →  tooltip-slice.js
dragSlice.js              →  drag-slice.js
```

## Entity Naming

| Entity | Convention | Example |
|---|---|---|
| Component | PascalCase | `BuildingModel`, `ApartmentCard` |
| Hook | useCamelCase | `useBuilding`, `useResponsiveConfig` |
| Function / variable | camelCase | `handleClick`, `focusCameraOnMesh` |
| Constant | UPPER_SNAKE_CASE | `BUILDING_CONFIG`, `UNIT_COLORS` |
| Redux action | camelCase | `setSelectedUnit`, `clearSelectedUnit` |
| CSS class | Tailwind utilities or kebab-case | `text-white`, `bg-[#050505]` |

## File ↔ Export Match

The file name must match the primary exported entity:
- `apartment-card.jsx` → exports `ApartmentCard`
- `use-building.js` → exports `useBuilding`
- `building-slice.js` → exports `buildingSlice`

## Formatting

### ESLint + Prettier

- ESLint and Prettier are **mandatory** and must be configured at the project root.
- A `.prettierrc` configuration file must exist.
- All code must pass `npm run lint` before commit.
- No manual formatting overrides are allowed.

### Pre-commit Hooks (Recommended)

- Use `husky` + `lint-staged` for automatic pre-commit formatting.
- Lint must pass in CI.

## Import Order (Recommended)

1. React / framework imports
2. Third-party libraries
3. Internal absolute imports (`@/store/...`, `@/hooks/...`)
4. Relative imports (`./`, `../`)
5. Style imports

## General Rules

- No `var` — use `const` by default, `let` only when reassignment is needed.
- No unused variables or imports.
- Prefer destructuring for props and state.
- Arrow functions for callbacks; named function declarations for components.
- No magic numbers — extract to named constants.
- Maximum one component per file (co-located sub-components are exceptions).
