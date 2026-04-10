import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Global-level error fallback.
 *
 * Renders a full-page error screen when the root error boundary catches
 * an unhandled exception. Offers a page reload and optional retry.
 */
const GlobalErrorFallback = ({ error, resetErrorBoundary }) => {
  const err = error instanceof Error ? error : new Error(String(error));

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-destructive">
            Something went wrong
          </h1>
          <p className="mt-2 text-muted-foreground">
            An unexpected error has occurred. Please try again or refresh the
            page.
          </p>
        </div>

        {import.meta.env.DEV && (
          <Alert variant="destructive" className="text-left">
            <AlertCircle className="size-4" />
            <AlertTitle>{err.name}</AlertTitle>
            <AlertDescription className="mt-1 break-all font-mono text-xs">
              {err.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={resetErrorBoundary}>
            Try again
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh page</Button>
        </div>
      </div>
    </div>
  );
};

export { GlobalErrorFallback };
