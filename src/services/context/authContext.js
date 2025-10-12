import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { initializeAuth, authService, userService } from '../ApiService/api';

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
    setAuthState({ ...result, loading: false });
  };

  useEffect(() => {
    loadAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await authService.login(username, password); // This calls your API
    console.log('Login response:', response); // Temporary console log for debugging
    // After successful API response, update context state
    setAuthState({
      isAuthenticated: true,
      user: userService.getUserData(),
      role: userService.getUserRole(),
      loading: false
    });
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
