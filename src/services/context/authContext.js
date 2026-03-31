import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { initializeAuth, authService, userService } from '../ApiService/api';
import { normalizeRole } from '../../utils/roleAccess';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    role: null,
    loading: true
  });

  const loadAuth = () => {
    const result = initializeAuth();
    setAuthState({ ...result, role: normalizeRole(result.role), loading: false });
  };

  useEffect(() => {
    loadAuth();
  }, []);

  const login = useCallback(async (pin) => {
    const response = await authService.login(pin);
    const role = normalizeRole(userService.getUserRole() || response?.role || response?.roles?.[0]);

    setAuthState({
      isAuthenticated: true,
      user: userService.getUserData(),
      role,
      loading: false
    });

    return { role };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAuthState({ isAuthenticated: false, user: null, role: null, loading: false });
  }, []);

  const value = useMemo(() => ({ ...authState, login, logout }), [authState, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
