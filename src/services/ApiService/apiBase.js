// apiBase.js
const API_BASE_URL = "https://lecture-routers-ace-regulation.trycloudflare.com";
// Utility function to safely convert values to numbers
export const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Utility function to safely format numbers as currency
export const formatCurrency = (amount) => {
  const numericAmount = toNumber(amount);
  return `Ksh ${numericAmount.toFixed(2)}`;
};

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pos_access_token',
  REFRESH_TOKEN: 'pos_refresh_token',
  USER_DATA: 'pos_user_data',
  ACCESS_TOKEN_TIMESTAMP: 'pos_access_token_timestamp',
  REFRESH_TOKEN_TIMESTAMP: 'pos_refresh_token_timestamp'
};

// Token expiration times in milliseconds
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours to match Django
const REFRESH_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 1 day to match Django
const REFRESH_THRESHOLD = 1 * 60 * 1000;

export const apiRequest = async (endpoint, method = 'GET', body = null, headers = {}, isRetry = false, queryParams = {}) => {
  try {
    // Only exempt login and refresh endpoints from authentication
    const authExemptEndpoints = ['/api/auth/login/', '/api/auth/refresh/'];
    const isAuthExempt = authExemptEndpoints.some(exempt => endpoint.startsWith(exempt));
    
    if (tokenService.isAuthenticated() && !isAuthExempt && !isRetry) {
      try {
        await tokenService.ensureValidAccessToken();
        headers.Authorization = `Bearer ${tokenService.getAccessToken()}`;
      } catch (error) {
        authService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    // Build URL with query parameters
    let url = `${API_BASE_URL}${endpoint}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      url += `?${queryString}`;
    }

    const config = { method, headers: { 'Content-Type': 'application/json', ...headers } };
    if (body) {
      config.body = JSON.stringify(body);
      console.log('Sending request body:', config.body);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkError) {
      console.error('Network Error:', networkError);
      throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend server is running.');
    }

    if (!response.ok) {
      if (response.status === 401 && !isRetry && tokenService.isAuthenticated()) {
        try {
          await tokenService.refreshIfNeeded();
          return apiRequest(endpoint, method, body, {
            ...headers,
            Authorization: `Bearer ${tokenService.getAccessToken()}`
          }, true);
        } catch (refreshError) {
          // Instead of throwing error, logout and navigate to login
          authService.logout();
          return; // Don't throw, let logout handle navigation
        }
      }
      let errorData = {};
      let errorMessage = '';

      try {
        errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorData.detail || `Request failed with status ${response.status}`;
      } catch (parseError) {
        // If response is not JSON, provide status-based error message
        if (response.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the URL.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = `Client error: ${response.status} ${response.statusText}`;
        } else if (response.status >= 500) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        } else {
          errorMessage = `Request failed with status ${response.status}`;
        }
      }

      console.error('API Error Response:', errorData);
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authService = {
  login: async (pin) => {
    const response = await apiRequest('/api/auth/login/', 'POST', { pin });
    tokenService.setTokens(response.access, response.refresh);
    const roles = response.roles?.length ? response.roles : (response.role ? [response.role] : []);
    userService.setUserData({
      username: response.username,
      name: response.name,
      roles,
      role: response.role || roles[0] || null,
      tenant_roles: response.tenant_roles,
      is_superadmin: response.is_superadmin,
      tenant: response.tenant,
      user_id: response.user_id,
      shift_status: response.shift_status,
      current_shift: response.current_shift,
      branch: response.branch,
      branch_id: response.branch_id
    });
    return response;
  },

  refreshToken: async () => {
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    const refreshToken = tokenService.getRefreshToken();
    const response = await apiRequest('/api/auth/refresh/', 'POST', { refresh: refreshToken });
    tokenService.setAccessToken(response.access);
    console.log('Token refreshed:', response.access);

    return response;
  },

  logout: async () => {
    console.log('Starting logout process...');

    try {
      const isAuthenticated = tokenService.isAuthenticated();
      console.log('Current authentication status:', isAuthenticated);

      if (isAuthenticated) {
        const accessToken = tokenService.getAccessToken();
        const refreshToken = tokenService.getRefreshToken();
        console.log('Attempting server logout with access token and refresh token');

        try {
          // ✅ Send refresh token in request body, access token in Authorization header
          const response = await apiRequest('/api/auth/logout/', 'POST', { refresh: refreshToken }, {
            Authorization: `Bearer ${accessToken}`
          });
          console.log('Server logout successful:', response);
          return response;
        } catch (serverError) {
          console.error('Server logout failed, proceeding with client cleanup:', {
            error: serverError,
            message: serverError.message,
            stack: serverError.stack
          });
        }
      } else {
        console.log('No active session found, proceeding with client cleanup');
      }
    } catch (error) {
      console.error('Unexpected error during logout process:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      throw error;
    } finally {
      try {
        console.log('Clearing client-side authentication data...');
        tokenService.clearTokens();
        userService.clearUserData();
        console.log('Logout process completed');
      } catch (cleanupError) {
        console.error('Error during client cleanup:', {
          error: cleanupError,
          message: cleanupError.message,
          stack: cleanupError.stack
        });
        throw cleanupError;
      }
    }
  }
};

export const userService = {
  getUserData: () => {
    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },
  setUserData: (userData) => localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
  clearUserData: () => localStorage.removeItem(STORAGE_KEYS.USER_DATA),
  getUserRole: () => {
    const data = userService.getUserData();
    return data?.roles?.[0] || data?.role || null;
  },
  getIsSuperAdmin: () => {
    const data = userService.getUserData();
    return data?.is_superadmin || false;
  },
  getTenant: () => {
    const data = userService.getUserData();
    return data?.tenant || null;
  }
};

export const tokenService = {
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    const now = Date.now().toString();
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP, now);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_TIMESTAMP, now);
  },
  setAccessToken: (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP, Date.now().toString());
  },
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getAccessTokenTimestamp: () => parseInt(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_TIMESTAMP) || '0', 10),
  getRefreshTokenTimestamp: () => parseInt(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_TIMESTAMP) || '0', 10),
  clearTokens: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
  isAuthenticated: () => Boolean(tokenService.getAccessToken()) && !tokenService.isAccessTokenExpired(),
  isAccessTokenExpired: () => (Date.now() - tokenService.getAccessTokenTimestamp()) > ACCESS_TOKEN_EXPIRY,
  isRefreshTokenExpired: () => (Date.now() - tokenService.getRefreshTokenTimestamp()) > REFRESH_TOKEN_EXPIRY,
  shouldRefreshAccessToken: () => {
    if (tokenService.isRefreshTokenExpired()) return false;
    return (Date.now() - tokenService.getAccessTokenTimestamp()) > (ACCESS_TOKEN_EXPIRY - REFRESH_THRESHOLD);
  },
  ensureValidAccessToken: async () => {
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    if (tokenService.shouldRefreshAccessToken()) await tokenService.refreshIfNeeded();
    if (tokenService.isAccessTokenExpired()) throw new Error('Access token expired');
    return tokenService.getAccessToken();
  },
  refreshIfNeeded: async () => {
    if (!tokenService.shouldRefreshAccessToken()) return tokenService.getAccessToken();
    if (tokenService.isRefreshTokenExpired()) throw new Error('Refresh token expired');
    try {
      await authService.refreshToken();
      return tokenService.getAccessToken();
    } catch (error) {
      authService.logout();
      throw error;
    }
  }
};

export const initializeAuth = () => {
  const refreshToken = tokenService.getRefreshToken();
  if (refreshToken && tokenService.isRefreshTokenExpired()) {
    authService.logout();
    return { isAuthenticated: false, user: null, roles: null };
  }
  return {
    isAuthenticated: tokenService.isAuthenticated(),
    user: userService.getUserData(),
    roles: userService.getUserRole()
  };
};

export const authAPI = {
  login: (credentials) => apiRequest('/api/auth/login/', 'POST', credentials),
  logout: () => apiRequest('/api/auth/logout/', 'POST'),
  refresh: () => apiRequest('/api/auth/refresh/', 'POST'),
};
