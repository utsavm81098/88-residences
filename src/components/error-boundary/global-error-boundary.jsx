import { ErrorBoundary } from "react-error-boundary";
import { GlobalErrorFallback } from "./global-error-fallback";
import { logError } from "./error-logger";

/**
 * Global error boundary.
 *
 * Wraps the entire application (typically in `main.jsx` or `App.jsx`).
 * Catches any unhandled error that bubbles past component-level boundaries.
 *
 * @example
 * ```jsx
 * <GlobalErrorBoundary>
 *   <App />
 * </GlobalErrorBoundary>
 * ```
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
const GlobalErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={(error, info) => logError({ error, info, level: "global" })}
    >
      {children}
    </ErrorBoundary>
  );
};

export { GlobalErrorBoundary };
