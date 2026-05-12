
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useParams,
  useLocation,
} from "react-router";
import HomePage from "@/pages/home";
import { WEB_ROUTES } from "./routes";
import i18n from "@/i18n";
import { SUPPORTED_LANGS } from "@/utils/languages";

import MainLayout from "@/layouts/main-layout";
import Inventory from "@/pages/inventory";
import { DASHBOARD_PREFIX } from "@/utils/constant";
import { getDashboardRoute } from "@/utils/helper";

const RootRedirect = () => {
  const location = useLocation();
  return <Navigate to={`${getDashboardRoute(i18n)}${location.search}${location.hash}`} replace />;
};

const LangGuard = () => {
  const { lang } = useParams();
  const location = useLocation();

  // Extract the true language from the parameter (handles both /dashboard-en and legacy /en)
  const isDashboard = lang?.startsWith(`${DASHBOARD_PREFIX}-`);
  const actualLang = isDashboard ? lang.replace(`${DASHBOARD_PREFIX}-`, "") : lang;
  
  // Normalize the language code from the URL (e.g. en-GB -> en)
  const normalizedLang = actualLang?.split("-")[0].toLowerCase() || "en";

  // 1. Backward compatibility: if URL is missing the dashboard- prefix, redirect it
  if (!isDashboard) {
    const targetLang = SUPPORTED_LANGS.includes(normalizedLang) ? normalizedLang : "en";
    const newPath = location.pathname.replace(new RegExp(`^\\/${lang}(\\/|$)`), `/${DASHBOARD_PREFIX}-${targetLang}$1`);
    return <Navigate to={`${newPath}${location.search}${location.hash}`} replace />;
  }

  // 2. If the URL has the prefix but the language is invalid, redirect to fallback
  if (!SUPPORTED_LANGS.includes(actualLang)) {
    const targetLang = SUPPORTED_LANGS.includes(normalizedLang) ? normalizedLang : "en";
    const newPath = location.pathname.replace(new RegExp(`^\\/${lang}(\\/|$)`), `/${DASHBOARD_PREFIX}-${targetLang}$1`);
    return <Navigate to={`${newPath}${location.search}${location.hash}`} replace />;
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
    loader: async ({ params }) => {
      const lang = params.lang;
      const actualLang = lang?.startsWith(`${DASHBOARD_PREFIX}-`)
        ? lang.replace(`${DASHBOARD_PREFIX}-`, "")
        : lang;

      if (actualLang && i18n.language !== actualLang && SUPPORTED_LANGS.includes(actualLang)) {
        await i18n.changeLanguage(actualLang);
      }
      return null;
    },
    children: [
      {
        // Removed path: "" to act as a proper pathless layout route in React Router v6
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
