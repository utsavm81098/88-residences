---
description: SOP-based code review checklist for all pull requests and code changes
---

# Code Review Workflow

Use this checklist when reviewing any code change against the SOP standards.

## Pre-Review

1. Read the PR description / change summary
2. Understand the intent and scope of the change
3. Identify which SOP sections are relevant

## Review Checklist

### §4 Architecture
- [ ] Files are in the correct directory (`components/`, `containers/`, `features/`, `store/`, `hooks/`, `utils/`)
- [ ] UI components do NOT access Redux store
- [ ] Containers have a dedicated hook (`use-<name>.js`)
- [ ] Features follow the `index.jsx` + `use-<name>.js` pattern
- [ ] No business logic in UI components

### §5 Coding Standards
- [ ] File names use kebab-case
- [ ] Components use PascalCase
- [ ] Hooks start with `use` + camelCase
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] No `var` — only `const` / `let`
- [ ] No unused imports or variables
- [ ] No magic numbers (use named constants)
- [ ] File name matches the primary export

### §8 State Management
- [ ] State is in the correct layer (local vs global)
- [ ] No derived data stored in Redux
- [ ] Slices are independent (no cross-slice imports)
- [ ] Dispatch only from containers/feature hooks
- [ ] Selectors used appropriately

### §10 Error Handling
- [ ] No raw `console.log` / `console.error` in production code
- [ ] Error boundaries wrap critical components
- [ ] API errors handled centrally (if applicable)
- [ ] User-friendly error messages (no technical jargon)

### §11 Custom Hooks
- [ ] No JSX returned from hooks
- [ ] Hooks return `{ data, handlers }`
- [ ] Global hooks are generic and reusable
- [ ] Feature-specific hooks co-located with feature
- [ ] One hook per file

### §12 Business / UI Separation
- [ ] UI components receive data via props only
- [ ] UI components emit callbacks (not dispatch)
- [ ] Containers compose UI components
- [ ] Business logic lives in hooks/store, not JSX

### §13 Styling & Theming
- [ ] No hardcoded color values (use design tokens)
- [ ] Tailwind CSS only (no mixed styling systems)
- [ ] `cn()` used for conditional classes
- [ ] No inline styles (except GSAP-controlled dynamic values)

### §15 Performance
- [ ] No new Three.js objects created in render loops
- [ ] `useMemo` / `useCallback` used where beneficial
- [ ] GSAP `killTweensOf()` called before new tweens
- [ ] Large lists use virtualization

### §16 Security
- [ ] No `dangerouslySetInnerHTML`
- [ ] No secrets or tokens in client code
- [ ] No API calls in UI components
- [ ] Environment variables used correctly

### §17 Testing
- [ ] New hooks / slices have tests
- [ ] Tests cover behavior, not implementation
- [ ] No snapshot-only tests

## Post-Review

1. Summarize findings grouped by severity (blocker / warning / suggestion)
2. Provide specific line references for each issue
3. Suggest fixes, not just problems
