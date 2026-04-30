import { createBrowserRouter, Navigate, Outlet, useParams } from "react-router";
import HomePage from "@/pages/home";
import { WEB_ROUTES } from "./routes";
import i18n from "@/i18n";
import { SUPPORTED_LANGS } from "@/utils/languages";

import MainLayout from "@/layouts/main-layout";
import Inventory from "@/pages/inventory";

const RootRedirect = () => {
  // Normalize language (e.g., 'en-GB' -> 'en') and fallback to 'en' if unsupported
  const detectedLang = i18n.language?.split("-")[0];
  const targetLang = SUPPORTED_LANGS.includes(detectedLang) ? detectedLang : "en";
  
  return <Navigate to={`/${targetLang}`} replace />;
};

const LangGuard = () => {
  const { lang } = useParams();
  if (!SUPPORTED_LANGS.includes(lang)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-white text-2xl font-outfit">
        Page Not Found
      </div>
    );
  }
  return <Outlet />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
  },
  {
    path: "/:lang",
    element: <LangGuard />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          {
            path: WEB_ROUTES.landing.path,
            Component: Inventory,
          },
          {
            path: WEB_ROUTES.home.path,
            Component: HomePage,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="flex items-center justify-center h-screen bg-background text-white text-2xl font-outfit">
        Page Not Found
      </div>
    ),
  },
]);

export default router;
