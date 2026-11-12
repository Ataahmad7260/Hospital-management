import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../api';

export const ROLE_CREDENTIALS: Record<Role, { email: string; label: string; sub: string }> = {
  ADMIN: {
    email: 'ataah@gmail.com',
    label: 'Ata Ahmed (Main Super Admin)',
    sub: 'Permanent Root Hospital Administrator',
  },
  DOCTOR: {
    email: 'ahmed@123.com',
    label: 'Dr ahmed',
    sub: 'Cardiology Consultant',
  },
  PHARMACIST: {
    email: 'aqdus@123.com',
    label: 'Aqdus',
    sub: 'Pharmacist'
  },
  PATIENT: {
    email: 'maaz@123.com',
    label: 'Maaz',
    sub: 'Patient'
  },
};

export const ROLE_REDIRECT_MAP: Record<Role, string> = {
  ADMIN: 'admin/dashboard',
  DOCTOR: 'doctor/dashboard',
  PHARMACIST: 'pharmacist/dashboard',
  PATIENT: 'patient/dashboard',
};

interface AuthContextType {
  currentUser: User | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  toast: { message: string; isError?: boolean } | null;
  showToast: (message: string, isError?: boolean) => void;
  switchRole: (role: Role) => Promise<void>;
  login: (email: string, password?: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    phoneNumber?: string;
    gender?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => api.getSavedUser());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const role: Role = currentUser?.role || 'PATIENT';
  const isAuthenticated = Boolean(currentUser && api.getToken());

  // On mount: verify token validity if user exists
  useEffect(() => {
    if (api.getToken()) {
      refreshUser();
    }
  }, []);

  const switchRole = async (targetRole: Role) => {
    setLoading(true);
    try {
      const creds = ROLE_CREDENTIALS[targetRole];
      const res = await api.login(creds.email, 'Hospital123!');
      setCurrentUser(res.user);
      showToast(`Switched active portal: ${creds.label} (${targetRole})`);
    } catch (err: any) {
      showToast(err.message || 'Failed to switch role', true);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password = 'Hospital123!'): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setCurrentUser(res.user);
      showToast(`Welcome back, ${res.user.firstName}!`);
      return res.user;
    } catch (err: any) {
      showToast(err.message || 'Login failed', true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    phoneNumber?: string;
    gender?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
  }): Promise<User> => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setCurrentUser(res.user);
      showToast(`Account successfully created. Welcome, ${res.user.firstName}!`);
      return res.user;
    } catch (err: any) {
      showToast(err.message || 'Registration failed', true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setCurrentUser(null);
    window.location.hash = '#/login';
    showToast('Signed out of session');
  };

  const refreshUser = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
      api.setSavedUser(user, false);
    } catch (err: any) {
      console.warn('Could not refresh session token:', err);
      if (/401|unauthorized|inactive|no longer exists/i.test(err?.message || '')) {
        api.clearToken();
        setCurrentUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        loading,
        toast,
        showToast,
        switchRole,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
