import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const API_BASE = 'https://showzy-backend-i1c2.onrender.com/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  
  // JWT and Admin Auth
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null);
  const [adminRole, setAdminRole] = useState(localStorage.getItem('adminRole') || null);
  
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('selectedCity') || '');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize: fetch profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE}/auth/profile/`, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
          } else {
            logout();
          }
        } catch (e) {
          console.error("Auth init failed", e);
        }
      }
      setLoading(false);
    };

    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE}/cities/`);
        if (response.ok) {
          const data = await response.json();
          setCities(data);
          const exists = data.some(c => String(c.id) === String(selectedCity));
          if (data.length > 0 && (!selectedCity || !exists)) {
            updateCity(data[0].id, data[0].name);
          }
        }
      } catch (e) {
        console.error("Failed to fetch cities", e);
      }
    };

    initAuth();
    fetchCities();
  }, [token]);

  // Initialize admin auth if admin token exists
  useEffect(() => {
    if (adminToken) {
      try {
        const storedUser = localStorage.getItem('adminUser');
        if (storedUser) {
          setAdminUser(JSON.parse(storedUser));
        }
        const storedRole = localStorage.getItem('adminRole');
        if (storedRole) {
          setAdminRole(storedRole);
        }
      } catch (e) {
        console.error("Admin auth init failed", e);
        logoutAdmin();
      }
    }
  }, [adminToken]);

  // ========== USER AUTH (Token-based) ==========
  const login = async (username, password) => {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const response = await fetch(`${API_BASE}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = Object.values(data).flat().join(' ') || 'Registration failed';
      throw new Error(errorMsg);
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedCity');
    localStorage.removeItem('selectedCityName');
    setToken(null);
    setUser(null);
  };

  // ========== ADMIN AUTH (JWT-based) ==========
  const theatreAdminLogin = async (username, password) => {
    const response = await fetch(`${API_BASE}/auth/jwt/theatre-admin-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Admin login failed');
    }

    localStorage.setItem('adminToken', data.access_token);
    localStorage.setItem('adminRefreshToken', data.refresh_token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    localStorage.setItem('adminRole', data.user.role);

    setAdminToken(data.access_token);
    setAdminUser(data.user);
    setAdminRole(data.user.role);

    return data.user;
  };

  const logoutAdmin = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    setAdminToken(null);
    setAdminUser(null);
    setAdminRole(null);
  };

  const isAdminAuthenticated = () => {
    return !!adminToken && adminRole && (adminRole === 'THEATRE_ADMIN' || adminRole === 'SUPERADMIN');
  };

  const isSuperAdmin = () => {
    return adminRole === 'SUPERADMIN';
  };

  const isTheatreAdmin = () => {
    return adminRole === 'THEATRE_ADMIN' || adminRole === 'SUPERADMIN';
  };

  const refreshAdminToken = async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (!refreshToken) {
      logoutAdmin();
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        logoutAdmin();
        return false;
      }

      const data = await response.json();
      localStorage.setItem('adminToken', data.access);
      setAdminToken(data.access);
      return true;
    } catch (e) {
      console.error("Token refresh failed", e);
      logoutAdmin();
      return false;
    }
  };

  // ========== UTILITY ==========
  const updateCity = (cityId, cityName) => {
    localStorage.setItem('selectedCity', cityId);
    localStorage.setItem('selectedCityName', cityName);
    setSelectedCity(cityId);
  };

  const selectedCityName = localStorage.getItem('selectedCityName') || (cities.find(c => c.id == selectedCity)?.name || '');

  return (
    <AuthContext.Provider value={{
      // User Auth
      user,
      token,
      login,
      register,
      logout,

      // Admin Auth
      adminUser,
      adminToken,
      adminRole,
      theatreAdminLogin,
      logoutAdmin,
      isAdminAuthenticated,
      isSuperAdmin,
      isTheatreAdmin,
      refreshAdminToken,

      // City Management
      selectedCity,
      selectedCityName,
      cities,
      updateCity,

      // Loading State
      loading,
      API_BASE
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
