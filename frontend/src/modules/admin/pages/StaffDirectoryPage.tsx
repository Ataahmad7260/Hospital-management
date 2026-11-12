import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import {
  Card,
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

export const StaffDirectoryPage: React.FC = () => {
  const { showToast } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await api.toggleUserStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u))
      );
      showToast(
        `User ${user.email} is now ${updated.isActive ? 'Active' : 'Deactivated'}`
      );
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const filteredUsers =
    roleFilter === 'ALL' ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="space-y-6 w-full">
      <Card
        title="Role-Based Access Control (RBAC) Directory"
        subtitle="Manage hospital staff credentials and account authorization statuses"
        icon={<Shield size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-xs">Filter by Role:</span>
            {['ALL', 'DOCTOR', 'PHARMACIST', 'PATIENT', 'ADMIN'].map((r) => (
              <button
                key={r}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase border transition-colors cursor-pointer',
                  roleFilter === r
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border'
                )}
                onClick={() => setRoleFilter(r)}
              >
                {r}
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
              <TableHead>Assigned Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Access Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">
                    {u.firstName} {u.lastName}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{u.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'solid' : 'outline'}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{u.phoneNumber || '—'}</span>
                </TableCell>
                <TableCell>
                  <StatusPill status={u.isActive ? 'ACTIVE' : 'DEACTIVATED'} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No accounts found matching filter
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
