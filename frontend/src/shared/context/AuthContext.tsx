import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../api';

export const ROLE_CREDENTIALS: Record<Role, { email: string; label: string; sub: string }> = {
  ADMIN: {
    email: 'admin@hospital.com',
    label: 'Chief Administrator',
    sub: 'Hospital Operations & Staffing',
  },
  DOCTOR: {
    email: 'doctor.smith@hospital.com',
    label: 'Dr. Sarah Smith',
    sub: 'Cardiology Consultant',
  },
  PHARMACIST: {
    email: 'pharmacist.alex@hospital.com',
    label: 'Alex Turner',
    sub: 'Central Pharmacy Dispensary',
  },
  PATIENT: {
    email: 'patient.jane@example.com',
    label: 'Jane Doe',
    sub: 'Registered Patient',
  },
};

interface AuthContextType {
  currentUser: User | null;
  role: Role;
  loading: boolean;
  toast: { message: string; isError?: boolean } | null;
  showToast: (message: string, isError?: boolean) => void;
  switchRole: (role: Role) => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
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

  const role: Role = currentUser?.role || 'ADMIN';

  useEffect(() => {
    if (!currentUser) {
      switchRole('ADMIN');
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

  const login = async (email: string, password = 'Hospital123!') => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setCurrentUser(res.user);
      showToast(`Welcome back, ${res.user.firstName}!`);
    } catch (err: any) {
      showToast(err.message || 'Login failed', true);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setCurrentUser(null);
    showToast('Signed out of session');
  };

  const refreshUser = async () => {
    try {
      const user = await api.getMe();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        toast,
        showToast,
        switchRole,
        login,
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
