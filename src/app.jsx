import { useTranslation } from "react-i18next";
import { getDirection } from "@/i18n";
import { DirectionProvider } from "@/components/ui/direction";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import AuthProvider from "@/auth/provider";
import { RouterProvider } from "react-router";
import router from "@/routes";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";

const AppProviders = () => {
  const { i18n } = useTranslation();
  const dir = getDirection(i18n.language);

  return (
    <QueryProvider>
      <DirectionProvider dir={dir}>
        <GlobalErrorBoundary>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </GlobalErrorBoundary>

        {/* Global UI utilities */}
        <Toaster
          position={dir === "rtl" ? "top-left" : "top-right"}
          dir={dir}
        />
      </DirectionProvider>
    </QueryProvider>
  );
};

export default AppProviders;


