import { useState, useCallback } from 'react';
import api from '../api/axios';
import endpoints from '../api/endpoints';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hms_admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hms_admin_token'));
  const [loading] = useState(false);

  const login = useCallback(async (email, password) => {
    const res = await api.post(endpoints.auth.login, { email, password });
    const data = res.data.data || res.data;
    const t = data.token || data.accessToken;
    const u = data.user || data.admin;
    setToken(t);
    setUser(u);
    localStorage.setItem('hms_admin_token', t);
    localStorage.setItem('hms_admin_user', JSON.stringify(u));
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hms_admin_token');
    localStorage.removeItem('hms_admin_user');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('hms_admin_user', JSON.stringify(updatedUser));
  }, []);

  // Platform roles: `super_admin` (full control) and `support` (read + tickets
  // only). `isSuperAdmin` drives whether write/manage UI is shown — the backend
  // already enforces this, so the UI gate is purely for a cleaner experience.
  const role = user?.role || null;
  const isSuperAdmin = role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated: !!token, role, isSuperAdmin, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
