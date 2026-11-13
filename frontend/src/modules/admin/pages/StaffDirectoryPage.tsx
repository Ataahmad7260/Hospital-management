import React, { useEffect, useState } from 'react';
import { Shield, Stethoscope, Pill, Users } from 'lucide-react';
import {
  Card,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  StatusPill,
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { User } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';
import { cn } from '@/lib/utils';

type StaffRoleFilter = 'ALL' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN';

const STAFF_FILTER_OPTIONS: Array<{ id: StaffRoleFilter; label: string }> = [
  { id: 'ALL', label: 'All Staff' },
  { id: 'DOCTOR', label: 'Doctors' },
  { id: 'PHARMACIST', label: 'Pharmacists' },
  { id: 'ADMIN', label: 'Hospital Staff' },
];

export const StaffDirectoryPage: React.FC<{ onOpenHospitalStaff?: () => void }> = ({
  onOpenHospitalStaff,
}) => {
  const { showToast } = useAuth();
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>('ALL');

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    try {
      const data = await api.getUsers(undefined, true);
      // Strictly exclude PATIENT accounts — patient counts & management belong to Patient Registry
      setStaffUsers(data.filter((u) => u.role !== 'PATIENT'));
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.email.toLowerCase() === 'ataah@gmail.com') {
      showToast('Action Denied: Main Administrator (ataah@gmail.com) is permanently protected.', true);
      return;
    }
    try {
      const updated = await api.toggleUserStatus(user.id, !user.isActive);
      setStaffUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u)),
      );
      showToast(
        `Staff member ${user.email} is now ${updated.isActive ? 'Active' : 'Deactivated'}`,
      );
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const filteredStaff = React.useMemo(() => {
    const list =
      roleFilter === 'ALL'
        ? staffUsers
        : staffUsers.filter((u) => u.role === roleFilter);
    return [...list].sort((a, b) => {
      const isAMain = a.email.toLowerCase() === 'ataah@gmail.com';
      const isBMain = b.email.toLowerCase() === 'ataah@gmail.com';
      if (isAMain && !isBMain) return -1;
      if (!isAMain && isBMain) return 1;
      return 0;
    });
  }, [staffUsers, roleFilter]);

  const doctorCount = staffUsers.filter((u) => u.role === 'DOCTOR').length;
  const pharmacistCount = staffUsers.filter((u) => u.role === 'PHARMACIST').length;
  const hospitalStaffCount = staffUsers.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Staff-Only KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-0">
        <KPICard
          label="Total Hospital Staff"
          value={staffUsers.length}
          subtext="Clinical, pharmacy & admin accounts"
          icon={<Users size={16} />}
        />
        <KPICard
          label="Doctors"
          value={doctorCount}
          subtext="Attending physicians & specialists"
          icon={<Stethoscope size={16} />}
        />
        <KPICard
          label="Pharmacists"
          value={pharmacistCount}
          subtext="Dispensary & inventory staff"
          icon={<Pill size={16} />}
        />
        <KPICard
          label="General Hospital Staff"
          value={hospitalStaffCount}
          subtext="Administration & operations clearance"
          icon={<Shield size={16} />}
        />
      </div>

      <Card
        title="Hospital Staff & Role-Based Access Control (RBAC)"
        subtitle="Manage portal login credentials (Doctors, Pharmacists, and General Hospital Admins). Use Hospital Staff to onboard Nurses, Ward Boys, Ward Girls &amp; support staff."
        icon={<Shield size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenHospitalStaff && (
              <Button variant="primary" size="sm" onClick={onOpenHospitalStaff}>
                Hospital Staff Directory (Nurses, Ward Boys...)
              </Button>
            )}
            <span className="text-muted-foreground text-xs">Filter by Staff Role:</span>
            {STAFF_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  'px-3 py-1.5 min-h-[38px] sm:min-h-8 rounded-full text-xs font-mono font-semibold uppercase border transition-colors cursor-pointer flex items-center',
                  roleFilter === opt.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border',
                )}
                onClick={() => setRoleFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Staff Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Access Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((u) => {
              const isMainAdmin = u.email.toLowerCase() === 'ataah@gmail.com';
              const roleDisplayLabel = isMainAdmin
                ? 'SUPER ADMIN'
                : u.role === 'ADMIN'
                  ? 'HOSPITAL STAFF'
                  : u.role;

              return (
                <TableRow key={u.id} className={isMainAdmin ? 'bg-muted/20' : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {u.firstName} {u.lastName}
                      </span>
                      {isMainAdmin && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-foreground bg-foreground text-background font-bold tracking-wider uppercase">
                          Main Admin
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'ADMIN' ? 'solid' : 'outline'}>
                      {roleDisplayLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{u.phoneNumber || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={u.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
                  </TableCell>
                  <TableCell>
                    {isMainAdmin ? (
                      <div
                        title="Main Administrator: Permanent root clearance cannot be deactivated"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border border-border bg-muted/60 text-muted-foreground cursor-not-allowed select-none"
                      >
                        <Shield size={12} className="text-foreground" />
                        <span>Protected</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredStaff.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No hospital staff accounts found matching filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default StaffDirectoryPage;
