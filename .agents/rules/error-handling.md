---
trigger: always_on
glob:
  - "src/**/*.{js,jsx,ts,tsx}"
description: Enforce error handling standards per SOP §10
---

# Error Handling Rules (SOP §10)

## Error Boundaries

### Mandatory Requirements

- A **global Error Boundary** is MANDATORY at the application root (`main.jsx` or `App.jsx`).
- Feature-level Error Boundaries are allowed for critical modules (e.g., 3D canvas).
- Error Boundaries must NOT contain business logic.
- Error Boundaries must NOT retry API calls automatically.

### Error Boundary Responsibilities

- Catch rendering errors
- Show fallback UI ("Something went wrong" screen)
- Log the error for monitoring
- Provide a refresh or navigation option

### Implementation Pattern

```jsx
// src/components/error-boundary.jsx
import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to centralized logger
    logger.error("UI Crash", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <FallbackUI />;
    }
    return this.props.children;
  }
}
```

## Logging

### Rules

- `console.log`, `console.error` are **forbidden in production code**.
- Use a centralized logging utility (`src/utils/logger.js`).
- Log only actionable and meaningful data.

### Never Log

- Tokens or auth headers
- Passwords
- Personal or sensitive user data

### What to Log

- Application crashes
- Unhandled exceptions
- API failures (with metadata, not payloads)
- Performance issues (optional)

### Logging Levels

| Level | Use Case |
|---|---|
| `info` | Lifecycle events |
| `warn` | Recoverable issues |
| `error` | Crashes and failures |

### Logger Pattern

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
- Critical errors → modal or error screen (not toast).
