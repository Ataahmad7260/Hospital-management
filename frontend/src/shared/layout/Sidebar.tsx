import React from 'react';
import {
  Activity,
  LayoutDashboard,
  TrendingUp,
  UserPlus,
  FileText,
  Stethoscope,
  Pill,
  Shield,
  Server,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Calendar,
  CreditCard,
} from 'lucide-react';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';

interface Props {
  activeView: string;
  onSelectView: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isDbOnline: boolean | null;
}

export const Sidebar: React.FC<Props> = ({
  activeView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  isDbOnline,
}) => {
  const { currentUser, role, switchRole, logout } = useAuth();

  const navGroups = [
    {
      groupTitle: 'Overview & Graph',
      items: [
        {
          id: 'dashboard',
          label: 'Master Dashboard',
          sublabel: 'Overview KPIs & Telemetry',
          icon: <LayoutDashboard size={17} />,
        },
        {
          id: 'daily-graph',
          label: 'Daily Admissions Graph',
          sublabel: 'Day-by-day patient intake',
          icon: <TrendingUp size={17} />,
        },
      ],
    },
    {
      groupTitle: 'Clinical Workflow & Portals',
      items: [
        {
          id: 'patient-portal',
          label: 'Patient Portal',
          sublabel: 'Clinical metrics & flow',
          icon: <LayoutDashboard size={17} />,
          highlight: true,
        },
        {
          id: 'admit-patient',
          label: 'Admit New Patient',
          sublabel: 'Write name & condition',
          icon: <UserPlus size={17} />,
        },
        {
          id: 'patient-overview',
          label: 'Patient Overview Ledger',
          sublabel: 'Entries by date, Rx, bill paid',
          icon: <FileText size={17} />,
        },
        {
          id: 'book-consultation',
          label: 'Book Consultation',
          sublabel: 'Appointments & Specialists',
          icon: <Calendar size={17} />,
        },
        {
          id: 'my-prescriptions',
          label: 'My Prescriptions',
          sublabel: 'Rx regimens & medications',
          icon: <FileText size={17} />,
        },
        {
          id: 'invoices-payments',
          label: 'Invoices & Payments',
          sublabel: 'Statements & settlements',
          icon: <CreditCard size={17} />,
        },
        {
          id: 'doctor-portal',
          label: 'Doctor Portal',
          sublabel: 'Check condition & prescribe',
          icon: <Stethoscope size={17} />,
        },
        {
          id: 'pharmacist-portal',
          label: 'Pharmacist Portal',
          sublabel: 'Make bill & payment option',
          icon: <Pill size={17} />,
        },
        {
          id: 'admin-portal',
          label: 'Administrator Portal',
          sublabel: 'Staff & hospital operations',
          icon: <Shield size={17} />,
        },
      ],
    },
    {
      groupTitle: 'Express & API Docs',
      items: [
        {
          id: 'telemetry',
          label: 'Express Page Tracker',
          sublabel: 'Live route hit analytics',
          icon: <Server size={17} />,
        },
        {
          id: 'swagger',
          label: 'Swagger API Docs',
          sublabel: 'OpenAPI 3.0 UI (/swagger)',
          icon: <BookOpen size={17} />,
        },
      ],
    },
  ];

  const roles: Role[] = ['ADMIN', 'DOCTOR', 'PHARMACIST', 'PATIENT'];

  const getRoleBadgeClass = (r: Role) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'DOCTOR':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'PHARMACIST':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'PATIENT':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <aside
      className={`relative flex flex-col bg-card text-card-foreground border-r border-border transition-all duration-300 select-none z-30 shrink-0 ${
        collapsed ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm shadow-primary/30">
            <Activity size={18} strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-foreground">AURA CLINICAL</span>
                <span className="text-[0.62rem] font-mono px-1.5 py-0.5 rounded bg-primary/15 border border-primary/25 text-primary font-bold">
                  v1.0
                </span>
              </div>
              <div className="text-[0.68rem] text-muted-foreground font-medium truncate flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isDbOnline ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-muted-foreground'
                  }`}
                />
                <span className={isDbOnline ? 'text-emerald-400' : ''}>
                  {isDbOnline ? 'MongoDB rs0 Live' : 'Connecting...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role Switcher Widget */}
      {!collapsed ? (
        <div className="p-3 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground font-mono uppercase mb-2">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Sparkles size={11} className="text-primary" /> Active Portal Scope
            </span>
            <span className={`font-bold px-2 py-0.5 rounded border text-[0.65rem] ${getRoleBadgeClass(role)}`}>
              {role}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {roles.map((r) => {
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={`px-2 py-1.5 rounded-md text-[0.68rem] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                      : 'bg-background/80 text-muted-foreground border-border hover:text-foreground hover:bg-secondary hover:border-border/80'
                  }`}
                >
                  {r === 'ADMIN' && <Shield size={11} />}
                  {r === 'DOCTOR' && <Stethoscope size={11} />}
                  {r === 'PHARMACIST' && <Pill size={11} />}
                  {r === 'PATIENT' && <UserPlus size={11} />}
                  <span>{r}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-2 border-b border-border text-center">
          <span className={`inline-block text-[0.6rem] font-mono px-1 rounded border font-bold ${getRoleBadgeClass(role)}`}>
            {role.slice(0, 3)}
          </span>
        </div>
      )}

      {/* Navigation Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {!collapsed && (
              <div className="px-3 py-1 text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground/80 font-bold">
                {group.groupTitle}
              </div>
            )}
            <div className="space-y-1 mt-1">
              {group.items.map((item) => {
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                    } ${item.highlight && !isActive ? 'border border-primary/25 bg-primary/5 text-foreground' : ''}`}
                  >
                    <span
                      className={`shrink-0 ${
                        isActive ? 'text-primary-foreground' : item.highlight ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <div className="truncate flex-1">
                        <div className="leading-tight truncate flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.highlight && (
                            <span
                              className={`text-[0.6rem] font-mono px-1.5 py-0.2 rounded font-bold ${
                                isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20 text-primary border border-primary/30'
                              }`}
                            >
                              NEW
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[0.65rem] font-normal truncate mt-0.5 ${
                            isActive ? 'text-primary-foreground/80' : 'text-muted-foreground/80'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom User Profile Card & Sign out */}
      <div className="p-3 border-t border-border bg-card/60">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {currentUser?.firstName?.[0] || 'U'}
                {currentUser?.lastName?.[0] || 'A'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-foreground truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
                <div className="text-[0.65rem] text-muted-foreground font-mono truncate">
                  {currentUser?.email}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-full p-2 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
