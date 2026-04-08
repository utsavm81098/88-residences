---
trigger: always_on
glob:
  - "src/**/*.test.{js,jsx,ts,tsx}"
  - "src/**/__tests__/**"
  - "vitest.config.*"
description: Enforce testing standards per SOP §17
---

# Testing Standards (SOP §17)

Testing is mandatory for business logic and containers.
UI components should be tested where behavior matters.

## Testing Framework

- **Recommended**: Vitest (fast, Vite-native)
- **Alternative**: Jest (if already configured)
- React Testing Library for component and hook tests

## What MUST Be Tested

| Layer | Test Requirement | Priority |
|---|---|---|
| Hooks (business logic) | MUST have tests | 🔴 High |
| Container hooks | MUST have tests | 🔴 High |
| Redux slices (reducers) | MUST have tests | 🔴 High |
| Utility functions | MUST have tests | 🟡 Medium |
| UI components (behavior) | SHOULD have tests | 🟡 Medium |
| UI components (rendering) | Optional | 🟢 Low |

## Testing Rules

### General

- ❌ **No snapshot-only tests** — snapshots alone are not sufficient.
- ✅ Focus on **user behavior and interactions**, not implementation details.
- ✅ Mock external dependencies and APIs.
- ❌ Do not test internal state or private methods.
- ❌ Do not test implementation details.

### Hook Testing

```js
import { renderHook, act } from "@testing-library/react";
import { useBuilding } from "./use-building";

describe("useBuilding", () => {
  it("should return building and glass scenes", () => {
    const { result } = renderHook(() => useBuilding({ config, controlsRef }));
    expect(result.current.buildingScene).toBeDefined();
    expect(result.current.glassScene).toBeDefined();
  });

  it("should handle pointer interactions", () => {
    // Test behavior, not implementation
  });
});
```

### Component Testing

- Use React Testing Library
- Prefer queries: `getByRole`, `getByText`, `getByLabelText`
- Avoid testing internal state

```js
import { render, screen, fireEvent } from "@testing-library/react";
import ApartmentCard from "./apartment-card";

describe("ApartmentCard", () => {
  it("renders unit name and status", () => {
    render(<ApartmentCard unit={mockUnit} />);
    expect(screen.getByText("Unit A")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });
});
```

### Redux Slice Testing

```js
import reducer, { nextBuilding, setSelectedUnit } from "./building-slice";

describe("buildingSlice", () => {
  it("should cycle to next building", () => {
    const state = reducer(initialState, nextBuilding());
    expect(state.currentBuildingIndex).toBe(1);
  });
});
```

## File Organization

```
src/
├── features/building/
│   ├── index.jsx
│   ├── use-building.js
│   └── __tests__/
│       └── use-building.test.js
│
├── store/slices/
│   ├── building-slice.js
│   └── __tests__/
│       └── building-slice.test.js
```

## Coverage

- Aim for meaningful coverage, not arbitrary percentages.
- Critical business logic: aim for 80%+ coverage.
- UI components: cover key interactions and edge cases.
