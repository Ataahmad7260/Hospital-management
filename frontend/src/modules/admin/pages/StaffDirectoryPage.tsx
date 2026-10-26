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
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { User } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

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
    <div className="portal-page">
      <Card
        title="Role-Based Access Control (RBAC) Directory"
        subtitle="Manage hospital staff credentials and account authorization statuses"
        icon={<Shield size={18} />}
        action={
          <div className="flex-row-gap">
            <span className="text-muted text-xs">Filter by Role:</span>
            {['ALL', 'DOCTOR', 'PHARMACIST', 'PATIENT', 'ADMIN'].map((r) => (
              <button
                key={r}
                className={`filter-chip ${roleFilter === r ? 'active' : ''}`}
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
                  <div className="font-semibold text-primary">
                    {u.firstName} {u.lastName}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{u.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'solid' : 'outline'}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted">{u.phoneNumber || '—'}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`status-pill ${
                      u.isActive ? 'status-active' : 'status-inactive'
                    }`}
                  >
                    {u.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                  </span>
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
                <TableCell colSpan={6} className="text-center text-muted py-8">
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
