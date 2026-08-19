import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useParams,
  useLocation,
} from "react-router";
import { WEB_ROUTES } from "./routes";
import i18n from "@/i18n";
import { SUPPORTED_LANGS } from "@/utils/languages";

import MainLayout from "@/layouts/main-layout";
import { DASHBOARD_PREFIX } from "@/utils/constant";
import { getDashboardRoute } from "@/utils/helper";

/**
 * RootRedirect: Handles base path "/" and redirects to the default dashboard prefix.
 */
const RootRedirect = () => {
  const location = useLocation();
  return (
    <Navigate
      to={`${getDashboardRoute(i18n)}${location.search}${location.hash}`}
      replace
    />
  );
};

/**
 * LangGuard: Enforces the dashboard prefix (e.g., /dashboard-en) and validates the language.
 * This acts as a virtual basename but allows internal SPA navigation without reloads.
 */
const LangGuard = () => {
  const { lang } = useParams();
  const location = useLocation();

  const isDashboard = lang?.startsWith(`${DASHBOARD_PREFIX}-`);
  const actualLang = isDashboard
    ? lang.replace(`${DASHBOARD_PREFIX}-`, "")
    : lang;

  // Normalize and validate the language
  const normalizedLang = actualLang?.split("-")[0].toLowerCase() || "en";
  const targetLang = SUPPORTED_LANGS.includes(normalizedLang)
    ? normalizedLang
    : "en";

  // 1. If prefix is missing or language is invalid, redirect to correct prefixed path
  if (!isDashboard || !SUPPORTED_LANGS.includes(actualLang)) {
    const currentPath = location.pathname.replace(`/${lang}`, "");
    const cleanPath = currentPath === "/" ? "" : currentPath;
    const newPath = `/${DASHBOARD_PREFIX}-${targetLang}${cleanPath}`;

    return (
      <Navigate to={`${newPath}${location.search}${location.hash}`} replace />
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
    HydrateFallback: () => null,
    loader: async ({ params }) => {
      // Sync i18next state with the URL parameter before rendering
      const lang = params.lang?.replace(`${DASHBOARD_PREFIX}-`, "");
      if (lang && i18n.language !== lang && SUPPORTED_LANGS.includes(lang)) {
        await i18n.changeLanguage(lang);
      }
      return null;
    },
    children: [
      {
        element: <MainLayout />,
        // These leaves intentionally declare no element/Component. They exist
        // to match the URL and to name the view via `handle`; the actual mount
        // is owned by containers/keep-alive-outlet, which keeps a visited
        // route's <Canvas> alive across navigations. A leaf route with no
        // element is a valid react-router pass-through and renders nothing.
        children: [
          {
            index: true,
            handle: { keepAlive: "home" },
          },
          {
            path: WEB_ROUTES.landing.path,
            handle: { keepAlive: "inventory" },
          },
          {
            path: WEB_ROUTES.home.path,
            handle: { keepAlive: "home" },
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <div className="flex items-center justify-center h-screen bg-background text-white text-2xl font-open-sans">
        Page Not Found
      </div>
    ),
  },
]);

export default router;
