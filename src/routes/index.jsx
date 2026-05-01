import { createBrowserRouter, Navigate, Outlet, useParams, useLocation } from "react-router";
import HomePage from "@/pages/home";
import { WEB_ROUTES } from "./routes";
import i18n from "@/i18n";
import { SUPPORTED_LANGS } from "@/utils/languages";

import MainLayout from "@/layouts/main-layout";
import Inventory from "@/pages/inventory";

const RootRedirect = () => {
  // Normalize language (e.g., 'en-GB' -> 'en') and fallback to 'en' if unsupported
  const detectedLang = i18n.language?.split("-")[0].toLowerCase() || "en";
  const targetLang = SUPPORTED_LANGS.includes(detectedLang) ? detectedLang : "en";
  
  return <Navigate to={`/${targetLang}`} replace />;
};

const LangGuard = () => {
  const { lang } = useParams();
  const location = useLocation();

  // Normalize the language code from the URL (e.g. en-GB -> en)
  const normalizedLang = lang?.split("-")[0].toLowerCase() || "en";

  // If the URL lang is NOT one of our supported base codes, redirect to the correct path
  if (!SUPPORTED_LANGS.includes(lang)) {
    const targetLang = SUPPORTED_LANGS.includes(normalizedLang) ? normalizedLang : "en";
    const newPath = location.pathname.replace(`/${lang}`, `/${targetLang}`);
    return <Navigate to={newPath} replace />;
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
