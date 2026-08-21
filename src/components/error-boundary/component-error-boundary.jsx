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
 * @param {Array} [props.resetKeys] - When any value in this array changes,
 *   the boundary automatically clears a caught error and re-renders its
 *   children — lets a transient failure (e.g. a flaky network load) retry
 *   itself the next time the caller's own state says "try again" instead of
 *   staying broken until a full page reload.
 */
const ComponentErrorBoundary = ({
  children,
  name,
  onReset,
  resetKeys,
  FallbackComponent = ErrorFallback,
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={(error, info) =>
        logError({ error, info, level: "component", componentName: name })
      }
      onReset={onReset}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
};

export { ComponentErrorBoundary };
