import { APP_TITLE, USER_ROLES } from "@/utils/app-constants";

export const AUTH_ROUTES = {
  login: {
    path: "/login",
    title: "Login",
  },
};

export const WEB_ROUTES = {
  landing: {
    path: "inventory",
    title: APP_TITLE,
  },
  home: {
    path: "",
    title: "Home",
  },
};

export const ADMIN_ROUTES = {
  dashboard: {
    path: "/dashboard",
    title: "Dashboard",
    roles: Object.values(USER_ROLES),
  },
};
