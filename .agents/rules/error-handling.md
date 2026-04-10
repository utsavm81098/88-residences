---
trigger: always_on
glob:
  - "src/**/*.{js,jsx,ts,tsx}"
description: Enforce error handling standards per SOP §10
---

# Error Handling Rules (SOP §10)

## Error Boundary Architecture

The project uses [`react-error-boundary`](https://github.com/bvaughn/react-error-boundary) for all error boundaries. All boundary components, fallbacks, and the error logger live in a single folder:

```
src/components/error-boundary/
├── index.js                       # Barrel — re-exports everything
├── global-error-boundary.jsx      # Root-level boundary (wraps entire app)
├── global-error-fallback.jsx      # Full-page fallback UI for global errors
├── component-error-boundary.jsx   # Section/widget-level boundary
├── error-fallback.jsx             # Compact Card fallback for component errors
└── error-logger.js                # Centralized logError() used by all boundaries
```

### Two Boundary Levels

| Level | Component | Fallback | Where Used |
|---|---|---|---|
| **Global** | `GlobalErrorBoundary` | `GlobalErrorFallback` (full-page) | `main.jsx` — wraps `<App />` |
| **Component** | `ComponentErrorBoundary` | `ErrorFallback` (compact Card) | Any section, widget, or page |

### Mandatory Requirements

- A **`GlobalErrorBoundary`** is MANDATORY at the application root (`main.jsx`).
- Feature-level or section-level boundaries SHOULD use **`ComponentErrorBoundary`**.
- Error Boundaries must NOT contain business logic.
- Error Boundaries must NOT retry API calls automatically.
- All boundaries MUST use `logError()` from `error-logger.js` for logging.

### Error Boundary Responsibilities

- Catch rendering errors
- Show appropriate fallback UI (full-page or compact Card)
- Log the error via `logError()` with structured context
- Provide a retry ("Try again") and/or page refresh option
- Show error details (name + message) in **development mode only**

## Usage Patterns

### Global Boundary (main.jsx)

```jsx
import { GlobalErrorBoundary } from "./components/error-boundary";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Provider store={store}>
        <App />
      </Provider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
```

### Component Boundary (any section or widget)

```jsx
import { ComponentErrorBoundary } from "@/components/error-boundary";

const Dashboard = () => (
  <ComponentErrorBoundary name="Revenue Chart" onReset={() => clearCache()}>
    <RevenueChart />
  </ComponentErrorBoundary>
);
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Content to protect |
| `name` | `string?` | Identifier logged when this section errors |
| `onReset` | `() => void?` | Called after the boundary resets (e.g., clear stale state) |

## Fallback Components

### Rules

- Fallback components are **pure UI** — no business logic, no Redux, no API calls.
- Error details (error name, message, component stack) are shown **only in `DEV` mode** via `import.meta.env.DEV`.
- Both fallbacks use shadcn/ui primitives (`Button`, `Card`, `Alert`) for consistent styling.
- `GlobalErrorFallback` renders a full-page centered layout with both "Try again" and "Refresh page" actions.
- `ErrorFallback` renders a compact `Card` with a single "Try again" action.

### ❌ Anti-Patterns

```jsx
// ❌ BAD: Custom class-based error boundary
class MyBoundary extends Component { ... }

// ❌ BAD: Inline fallback JSX inside the boundary
<ErrorBoundary fallbackRender={({ error }) => <div>{error.message}</div>}>

// ❌ BAD: Exposing error details in production
<p>{error.stack}</p>
```

### ✅ Correct Patterns

```jsx
// ✅ GOOD: Use the project's functional boundary components
<GlobalErrorBoundary>
  <App />
</GlobalErrorBoundary>

// ✅ GOOD: Wrap critical sections with ComponentErrorBoundary
<ComponentErrorBoundary name="3D Canvas">
  <Canvas> ... </Canvas>
</ComponentErrorBoundary>
```

## Logging

### Error Logger (`error-logger.js`)

All error boundaries route through `logError()` — the single centralized error logger.

```js
import { logError } from "@/components/error-boundary";

logError({
  error,        // The caught error object
  info,         // React ErrorInfo (componentStack)
  level,        // "global" | "component"
  componentName // Optional identifier string
});
```

**Behavior:**

| Environment | Behavior |
|---|---|
| **Development** | Grouped `console.group` with error, context, and component stack |
| **Production** | Silent — integrate with Sentry, LogRocket, or Datadog (TODO) |

### General Logging Rules

- `console.log`, `console.error` are **forbidden in production code**.
- Use `logError()` for boundary errors and `logger` from `src/utils/logger.js` for general app logging.
- Log only actionable and meaningful data.

### Never Log

- Tokens or auth headers
- Passwords
- Personal or sensitive user data

### What to Log

- Application crashes (via error boundaries)
- Unhandled exceptions
- API failures (with metadata, not payloads)
- Performance issues (optional)

### Logging Levels

| Level | Use Case |
|---|---|
| `info` | Lifecycle events |
| `warn` | Recoverable issues |
| `error` | Crashes and failures |

### General Logger (`src/utils/logger.js`)

For non-boundary logging (general app events, warnings, etc.):

```js
// src/utils/logger.js
const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args) => isDev && console.info("[INFO]", ...args),
  warn: (...args) => isDev && console.warn("[WARN]", ...args),
  error: (...args) => console.error("[ERROR]", ...args), // Always log errors
};
```

## Toast / User Feedback

- Toast logic must be centralized (utility or hook).
- UI components must NOT hardcode toast messages.
- Avoid duplicate toasts for the same event.
- Critical errors → error boundary fallback screen (not toast).
