---
description: Architecture audit workflow to verify SOP compliance across the codebase
---

# Frontend Architecture Audit Workflow

Use this workflow to audit the project's architecture against the SOP standards. Run periodically or before major releases.

## Phase 1: Folder Structure Audit

1. **Verify required directories exist**
   ```
   src/
   ├── assets/          ✅/❌
   ├── components/      ✅/❌
   │   └── ui/          ✅/❌
   ├── containers/      ✅/❌
   ├── features/        ✅/❌
   ├── hooks/           ✅/❌
   ├── layouts/         ✅/❌ (optional for this project)
   ├── lib/             ✅/❌
   ├── store/           ✅/❌ (check: is it still `redux/`?)
   │   └── slices/      ✅/❌ (check: is it still `reducers/`?)
   ├── utils/           ✅/❌
   └── config/          ✅/❌
   ```

2. **Check for legacy/unused directories**
   - `src/features/controls/` (unused)
   - `src/features/direction/` (unused)
   - `src/features/environment/` (unused)
   - `src/features/grass-grid/` (unused)
   - `src/features/lighting/` (unused)

## Phase 2: File Naming Audit

1. **Scan for non-kebab-case files**
   ```bash
   find src -name "*.js" -o -name "*.jsx" | grep -E '[A-Z]' | grep -v node_modules
   ```

2. **Known violations (current)**
   - `src/hooks/useResponsiveConfig.js` → `use-responsive-config.js`
   - `src/redux/reducers/buildingSlice.js` → `building-slice.js`
   - `src/redux/reducers/tooltipSlice.js` → `tooltip-slice.js`
   - `src/redux/reducers/dragSlice.js` → `drag-slice.js`

## Phase 3: Architectural Boundaries Audit

1. **Check UI components for store access**
   ```bash
   # Files in components/ that import useSelector or useDispatch
   grep -rl "useSelector\|useDispatch" src/components/
   ```

2. **Known violations (current)**
   - `src/components/ui/top-navigation/index.jsx` — uses `useSelector`, `useDispatch`
   - `src/components/ui/top-navigation/mobile-menu.jsx` — uses `useSelector`, `useDispatch`
   - `src/components/ui/inventory-sidebar/index.jsx` — likely uses `useSelector`, `useDispatch`

3. **Check for business logic in JSX**
   - Look for data transformations, `.filter()`, `.map()` with complex logic inside JSX
   - These should be in hooks, not inline

## Phase 4: State Management Audit

1. **Verify store structure**
   - All slices in one aggregator file
   - No cross-slice dependencies
   - No derived data in store

2. **Check for local state misuse**
   - State that should be in Redux but is in `useState`
   - State that should be local but is in Redux

## Phase 5: Error Handling Audit

1. **Check for Error Boundary at root** — `main.jsx` or `App.jsx`
2. **Search for raw console usage**
   ```bash
   grep -rn "console\.\(log\|error\|warn\)" src/ --include="*.js" --include="*.jsx" | grep -v "logger"
   ```

## Phase 6: Styling Audit

1. **Search for hardcoded colors**
   ```bash
   grep -rn "bg-\[#\|text-\[#\|border-\[#" src/ --include="*.jsx"
   ```

2. **Verify design tokens are used** — check `tailwind.config.js` for custom tokens

## Phase 7: Configuration Audit

1. **Check required config files exist**
   - `.nvmrc` — Node version
   - `.env.example` — Environment template
   - `.prettierrc` — Prettier config
   - `eslint.config.js` — ESLint config
   - `package.json` → `engines` field

## Output

Generate a compliance report with:
- ✅ Compliant items
- ❌ Violations (with file paths and line numbers)
- 🟡 Warnings (non-blocking but recommended fixes)
- 📋 Migration steps for each violation
