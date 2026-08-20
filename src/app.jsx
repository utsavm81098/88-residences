import { useTranslation } from "react-i18next";
import { getDirection } from "@/i18n";
import { DirectionProvider } from "@/components/ui/direction";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import AuthProvider from "@/auth/provider";
import { RouterProvider } from "react-router";
import router from "@/routes";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import GlobalLoader from "@/containers/global-loader";

const AppProviders = () => {
  const { i18n } = useTranslation();
  const dir = getDirection(i18n.language);

  return (
    <QueryProvider>
      <DirectionProvider dir={dir}>
        <GlobalErrorBoundary>
          <AuthProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </AuthProvider>
        </GlobalErrorBoundary>

        {/* Mounted above the router (but still inside the Redux/i18n
            providers it needs): see containers/global-loader for why this
            has to sit here rather than inside Home/Inventory's own
            containers. */}
        <GlobalLoader />

        {/* Global UI utilities */}
        <Toaster
          {...{
            position: dir === "rtl" ? "top-left" : "top-right",
            dir,
          }}
        />
      </DirectionProvider>
    </QueryProvider>
  );
};

export default AppProviders;
