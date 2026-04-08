---
description: Meta-workflow for orchestrating complex multi-step architectural changes
---

# Orchestrator Workflow

Use this workflow when executing a complex architectural change that spans multiple files, directories, or concerns. This is the coordination layer above individual workflows.

## When to Use

- Renaming folder structures (e.g., `redux/` → `store/`)
- Migrating file naming conventions (e.g., PascalCase → kebab-case)
- Introducing a new architectural layer (e.g., adding `containers/`)
- Refactoring existing code to match SOP

## Steps

### 1. Impact Analysis
- List all files affected by the change
- Identify import chains that will break
- Note any test files that reference affected paths
- Check for dynamic imports or lazy-loaded references

### 2. Create Migration Plan
- Write a checklist of all files to change
- Order changes to minimize breakage (dependencies first)
- Identify rollback points

### 3. Execute in Order

For a typical folder/file rename:

```
1. Create target directories           (non-breaking)
2. Copy files to new locations          (non-breaking)
3. Update all imports in consuming files (breaking → fix immediately)
4. Update store/aggregator registrations (breaking → fix immediately)
5. Verify build passes                  (checkpoint)
6. Remove old files                     (cleanup)
7. Run lint + tests                     (verification)
```

### 4. Verify After Each Step
- `npm run lint` — no ESLint errors
- `npm run dev` — dev server starts without errors
- `npm run build` — production build succeeds (optional, for major changes)
- Check browser — no runtime errors in console

### 5. Update References
After structural changes:
- Update `GEMINI.md` with new paths
- Update import aliases in `vite.config.js` or `jsconfig.json` if needed
- Update any workflow files that reference old paths

## Example: `redux/` → `store/` Migration

```markdown
- [ ] Create `src/store/` and `src/store/slices/`
- [ ] Copy `src/redux/index.js` → `src/store/index.js`
- [ ] Copy `src/redux/reducers/buildingSlice.js` → `src/store/slices/building-slice.js`
- [ ] Copy `src/redux/reducers/tooltipSlice.js` → `src/store/slices/tooltip-slice.js`
- [ ] Copy `src/redux/reducers/dragSlice.js` → `src/store/slices/drag-slice.js`
- [ ] Copy `src/redux/reducers/index.js` → `src/store/slices/index.js`
- [ ] Update imports in:
  - [ ] `src/main.jsx`
  - [ ] `src/App.jsx`
  - [ ] `src/features/building/use-building.js`
  - [ ] `src/features/building-tooltip/use-tooltip.js`
  - [ ] `src/features/adaptive-controls/index.jsx`
  - [ ] `src/features/direction-label/use-direction-label.js`
  - [ ] `src/components/ui/top-navigation/index.jsx`
  - [ ] `src/components/ui/top-navigation/mobile-menu.jsx`
  - [ ] `src/components/ui/inventory-sidebar/index.jsx`
- [ ] Verify `npm run dev` works
- [ ] Delete `src/redux/` directory
- [ ] Run `npm run lint`
- [ ] Update GEMINI.md paths
```

## Rollback Plan

If something breaks during migration:
1. Keep old files until verification passes
2. Revert imports to old paths if needed
3. Only delete old files after full verification
