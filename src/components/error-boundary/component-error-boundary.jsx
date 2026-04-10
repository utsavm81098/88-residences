import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./error-fallback";
import { logError } from "./error-logger";

/**
 * Component-level error boundary.
 *
 * Wrap individual sections, pages, or widgets with this component to
 * isolate failures without crashing the entire application.
 *
 * @example
 * ```jsx
 * <ComponentErrorBoundary name="Dashboard Chart">
 *   <RevenueChart />
 * </ComponentErrorBoundary>
 * ```
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.name] - Optional name to identify which section errored in logs.
 * @param {() => void} [props.onReset] - Called after the boundary resets.
 */
const ComponentErrorBoundary = ({ children, name, onReset }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) =>
        logError({ error, info, level: "component", componentName: name })
      }
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
};

export { ComponentErrorBoundary };
