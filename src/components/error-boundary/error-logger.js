/**
 * Centralized error logger for error boundaries.
 *
 * Replace the console calls with your preferred error-tracking service
 * (e.g. Sentry, LogRocket, Datadog) in production.
 *
 * @param {Object} payload
 * @param {unknown} payload.error
 * @param {import('react').ErrorInfo} payload.info
 * @param {'global' | 'component'} [payload.level='component']
 * @param {string} [payload.componentName]
 */
const logError = ({ error, info, level = "component", componentName }) => {
  const context = {
    level,
    componentName,
    componentStack: info.componentStack,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.group(`[ErrorBoundary] ${level} error`);
    console.error(error);
    console.info(context);
    console.groupEnd();
    return;
  }

  // TODO: Send to your error-tracking service in production
  // Example:
  // Sentry.captureException(error, { extra: context });
  // LogRocket.captureException(error, { extra: context });
};

export { logError };
