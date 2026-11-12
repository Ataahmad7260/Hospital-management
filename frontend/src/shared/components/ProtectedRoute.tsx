import React from 'react';
import { useAuth, ROLE_REDIRECT_MAP } from '../context/AuthContext';
import type { Role } from '../types';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  onNavigate?: (view: string) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  onNavigate,
  children,
}) => {
  const { currentUser, role, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Verifying Clinical Clearance...
        </span>
      </div>
    );
  }

  // 1. Not Authenticated
  if (!isAuthenticated || !currentUser) {
    return null; // Parent layout will route to login
  }

  // 2. Role Check
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const userDashboard = ROLE_REDIRECT_MAP[role] || 'dashboard';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-border bg-card/60 backdrop-blur-md p-8 rounded-xl shadow-2xl text-center space-y-5">
          <div className="mx-auto w-12 h-12 rounded-full border border-border bg-muted flex items-center justify-center text-foreground">
            <ShieldAlert size={22} className="text-foreground" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-block border border-border px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              403 • Insufficient Permissions
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Restricted Clinical Resource
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your role <code className="px-1.5 py-0.5 border border-border rounded text-[11px] font-mono bg-muted text-foreground">[{role}]</code> is not authorized to access this module.
            </p>
          </div>

          <div className="border border-border/80 bg-muted/40 p-3 rounded-lg text-left text-xs font-mono space-y-1">
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Current Identity:</span>
              <span className="text-foreground font-semibold">{currentUser.firstName} {currentUser.lastName}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-[11px]">
              <span>Required Role(s):</span>
              <span className="text-foreground font-semibold">{allowedRoles.join(' / ')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => onNavigate?.(userDashboard)}
              className="w-full bg-foreground text-background font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to My Authorized Portal</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={logout}
              className="w-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={12} />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
