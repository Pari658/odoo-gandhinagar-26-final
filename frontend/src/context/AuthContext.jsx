import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('uf_access_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('uf_refresh_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uf_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (accessToken) localStorage.setItem('uf_access_token', accessToken);
    else localStorage.removeItem('uf_access_token');
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem('uf_refresh_token', refreshToken);
    else localStorage.removeItem('uf_refresh_token');
  }, [refreshToken]);

  useEffect(() => {
    if (user) localStorage.setItem('uf_user_profile', JSON.stringify(user));
    else localStorage.removeItem('uf_user_profile');
  }, [user]);

  // Login
  const login = async (loginInput, password) => {
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/auth/login', { loginId: loginInput, email: loginInput, password });
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  // 2-Way JWT Signup
  const signup = async (payload) => {
    setLoading(true);
    try {
      const data = await apiRequest('POST', '/auth/signup', payload);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  // 2-Way JWT Logout
  const logout = async () => {
    if (refreshToken) {
      try {
        await apiRequest('POST', '/auth/logout', { refreshToken });
      } catch (e) {
        // ignore logout errors
      }
    }
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}