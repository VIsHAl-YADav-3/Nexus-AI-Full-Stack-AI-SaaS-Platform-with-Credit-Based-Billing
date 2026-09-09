import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  loginRequest,
  signupRequest,
  getMeRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
} from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('nexus_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  const persistSession = (nextToken, nextUser) => {
    localStorage.setItem('nexus_token', nextToken);
    localStorage.setItem('nexus_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = () => {
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('nexus_token')) return;
    try {
      const { data } = await getMeRequest();
      setUser(data.user);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
    } catch {
      clearSession();
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload) => {
    const { data } = await loginRequest(payload);
    persistSession(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
    return data;
  };

  const signup = async (payload) => {
    const { data } = await signupRequest(payload);
    persistSession(data.token, data.user);
    toast.success('Account created — welcome to Nexus AI!');
    return data;
  };

  const forgotPassword = async (payload) => {
    const { data } = await forgotPasswordRequest(payload);
    toast.success(data.message || 'Reset code sent');
    return data;
  };

  const resetPassword = async (payload) => {
    const { data } = await resetPasswordRequest(payload);
    toast.success('Password reset — please log in');
    return data;
  };

  const logout = () => {
    clearSession();
    toast.success('Logged out successfully');
  };

  const updateCredits = (credits) => {
    setUser((prev) => {
      const next = { ...prev, credits };
      localStorage.setItem('nexus_user', JSON.stringify(next));
      return next;
    });
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('nexus_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        updateCredits,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
