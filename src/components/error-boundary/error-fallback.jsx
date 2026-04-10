import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Component-level error fallback.
 *
 * Renders a compact Card with error details and a retry button.
 * Use this as the `FallbackComponent` for section-level error boundaries.
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const err = error instanceof Error ? error : new Error(String(error));

  return (
    <Card className="w-full my-8 max-w-lg border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Something went wrong</CardTitle>
        <CardDescription>
          An unexpected error occurred in this section.
        </CardDescription>
      </CardHeader>

      {import.meta.env.DEV && (
        <div className="px-6">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{err.name}</AlertTitle>
            <AlertDescription className="mt-1 break-all font-mono text-xs">
              {err.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
          Try again
        </Button>
      </CardFooter>
    </Card>
  );
};

export { ErrorFallback };
