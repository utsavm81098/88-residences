import { getLocalStorage } from '@/utils/local-storage';
import { LOCAL_STORAGE_KEY, CACHED_URL_LOCAL_STORAGE_KEY } from '@/utils/app-constants';
import { decodeToken, isTokenActive } from '@/utils/helper';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/routes/routes';

const REDIRECTION = {
  admin: ADMIN_ROUTES.dashboard.path,
  user: ADMIN_ROUTES.dashboard.path,
  manager: ADMIN_ROUTES.dashboard.path,
};

/**
 * Get the current authentication state (for use outside of React)
 */
const getAuth = (options = {}) => {
  const { role: requiredRole } = options;
  const token = getLocalStorage(LOCAL_STORAGE_KEY);
  const cachedRedirectUrl = getLocalStorage(CACHED_URL_LOCAL_STORAGE_KEY);

  const isAuthenticated = isTokenActive(token);

  let user = null;
  let role = '';

  if (isAuthenticated) {
    user = decodeToken(token);
    role = user?.role || '';
  }

  const isAuthorized = !requiredRole || role === requiredRole;

  const redirectUrl = isAuthenticated
    ? REDIRECTION[role] || ADMIN_ROUTES.dashboard.path
    : AUTH_ROUTES.login.path;

  return {
    isAuthenticated,
    isAuthorized,
    user,
    role,
    token,
    redirectUrl: cachedRedirectUrl || redirectUrl,
  };
};

export { getAuth };
