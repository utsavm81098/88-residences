import { useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { LOCAL_STORAGE_KEY } from '@/utils/app-constants';
import { decodeToken } from '@/utils/helper';
import AuthContext from './context';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/routes/routes';

const REDIRECTION = {
  admin: ADMIN_ROUTES.dashboard.path,
  user: ADMIN_ROUTES.dashboard.path,
  manager: ADMIN_ROUTES.dashboard.path, // Defaulting for now
};

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  const {
    storedValue: token,
    setValue: setToken,
    removeValue: removeToken,
  } = useLocalStorage(LOCAL_STORAGE_KEY, '');

  const user = useMemo(() => {
    if (!token) return {};
    try {
      return decodeToken(token) || {};
    } catch {
      return {};
    }
  }, [token]);

  const role = user?.role ?? '';

  const redirectUrl = useMemo(() => {
    if (!role) return AUTH_ROUTES.login.path;
    return REDIRECTION[role] || ADMIN_ROUTES.dashboard.path;
  }, [role]);

  const resetAllStores = useCallback(() => {
    dispatch({ type: 'app/reset' });
  }, [dispatch]);

  const login = useCallback(
    (newToken) => {
      setToken(newToken);
    },
    [setToken],
  );

  const logout = useCallback(() => {
    removeToken();
    resetAllStores();
  }, [removeToken, resetAllStores]);

  /**
   * Memoize context value
   * Prevents full app re-render unless dependencies actually change
   */
  const contextValue = useMemo(
    () => ({
      user,
      role: user?.role || '',
      redirectUrl,
      login,
      logout,
    }),
    [user, redirectUrl, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
