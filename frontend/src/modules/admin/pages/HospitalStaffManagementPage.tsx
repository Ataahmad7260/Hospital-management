import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  HeartPulse,
  UserCheck,
  Wrench,
  Shield,
  Phone,
  Mail,
  Clock,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
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
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type {
  HospitalStaff,
  HospitalStaffCategory,
  HospitalStaffStats,
  HospitalStaffStatus,
  StaffShift,
} from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';
import {
  HOSPITAL_STAFF_ROLE_OPTIONS,
  STAFF_SHIFT_LABELS,
  getStaffRoleMeta,
} from '../constants/hospitalStaffCategories';
import { AddHospitalStaffModal } from '../components/AddHospitalStaffModal';

interface HospitalStaffManagementPageProps {
  refreshTrigger?: number;
}

const ROLE_FILTER_CHIPS: Array<{ id: 'ALL' | HospitalStaffCategory; label: string }> = [
  { id: 'ALL', label: 'All Hospital Staff' },
  { id: 'NURSE', label: 'Nurses' },
  { id: 'HEAD_NURSE', label: 'Head Nurses' },
  { id: 'MIDWIFE', label: 'Midwives' },
  { id: 'WARD_BOY', label: 'Ward Boys' },
  { id: 'WARD_GIRL', label: 'Ward Girls' },
  { id: 'LAB_TECHNICIAN', label: 'Lab Techs' },
  { id: 'OT_TECHNICIAN', label: 'OT Techs' },
  { id: 'RADIOLOGY_TECHNICIAN', label: 'Radiology Techs' },
  { id: 'PHARMACY_ASSISTANT', label: 'Pharmacy Asst' },
  { id: 'PARAMEDIC', label: 'Paramedics' },
  { id: 'PHYSIOTHERAPIST', label: 'Physiotherapists' },
  { id: 'RECEPTIONIST', label: 'Receptionists' },
  { id: 'BILLING_CLERK', label: 'Billing Clerks' },
  { id: 'HOUSEKEEPING', label: 'Housekeeping' },
  { id: 'SECURITY', label: 'Security' },
  { id: 'ADMIN_STAFF', label: 'Admin Staff' },
  { id: 'OTHER', label: 'Other' },
];

export const HospitalStaffManagementPage: React.FC<HospitalStaffManagementPageProps> = ({
  refreshTrigger = 0,
}) => {
  const { showToast } = useAuth();
  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [stats, setStats] = useState<HospitalStaffStats | null>(null);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | HospitalStaffCategory>('ALL');
  const [shiftFilter, setShiftFilter] = useState<'ALL' | StaffShift>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HospitalStaffStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<HospitalStaff | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadStaffData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, staffStats] = await Promise.all([
        api.getHospitalStaff(),
        api.getHospitalStaffStats().catch(() => null),
      ]);
      setStaffList(list);
      setStats(staffStats);
    } catch (err: any) {
      showToast(err.message || 'Failed to load hospital staff roster', true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadStaffData();
  }, [refreshTrigger, loadStaffData]);

  const handleOpenAddModal = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: HospitalStaff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (staff: HospitalStaff, nextStatus: HospitalStaffStatus) => {
    try {
      const updated = await api.updateHospitalStaffStatus(staff.id, nextStatus);
      setStaffList((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
      const refreshedStats = await api.getHospitalStaffStats().catch(() => null);
      if (refreshedStats) setStats(refreshedStats);
      showToast(
        `${staff.firstName} ${staff.lastName} status set to ${nextStatus.replace('_', ' ')}`,
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update staff duty status', true);
    }
  };

  const handleDeleteStaff = async (staff: HospitalStaff) => {
    try {
      await api.deleteHospitalStaff(staff.id);
      setConfirmDeleteId(null);
      showToast(`Removed ${staff.firstName} ${staff.lastName} (${staff.employeeCode}) from staff roster`);
      loadStaffData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete hospital staff record', true);
    }
  };

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffList.filter((s) => {
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
      if (shiftFilter !== 'ALL' && s.shift !== shiftFilter) return false;
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${s.employeeCode} ${s.firstName} ${s.lastName} ${s.designation} ${s.category} ${s.department} ${s.assignedWard || ''} ${s.phoneNumber} ${s.email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [staffList, categoryFilter, shiftFilter, statusFilter, searchQuery]);

  const nursesTotal =
    stats?.groups.nurses ??
    staffList.filter((s) => ['NURSE', 'HEAD_NURSE', 'MIDWIFE'].includes(s.category)).length;
  const wardBoysCount =
    stats?.groups.wardBoys ?? staffList.filter((s) => s.category === 'WARD_BOY').length;
  const wardGirlsCount =
    stats?.groups.wardGirls ?? staffList.filter((s) => s.category === 'WARD_GIRL').length;
  const techsAndSupportTotal =
    (stats?.groups.techniciansAndAllied ?? 0) + (stats?.groups.supportAndOperations ?? 0) ||
    staffList.filter(
      (s) => !['NURSE', 'HEAD_NURSE', 'MIDWIFE', 'WARD_BOY', 'WARD_GIRL'].includes(s.category),
    ).length;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Hospital Workforce Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 min-w-0">
        <KPICard
          label="Total Hospital Staff"
          value={stats?.total ?? staffList.length}
          subtext={`${stats?.active ?? staffList.filter((s) => s.status === 'ACTIVE').length} active duty • ${stats?.onLeave ?? 0} on leave`}
          icon={<Users size={16} />}
        />
        <KPICard
          label="Nursing &amp; Midwifery"
          value={nursesTotal}
          subtext="Staff Nurses, Head Nurses &amp; Midwives"
          icon={<HeartPulse size={16} />}
        />
        <KPICard
          label="Ward Boys &amp; Ward Girls"
          value={wardBoysCount + wardGirlsCount}
          subtext={`${wardBoysCount} Ward Boys • ${wardGirlsCount} Ward Girls`}
          icon={<UserCheck size={16} />}
        />
        <KPICard
          label="Tech, Front Desk &amp; Support"
          value={techsAndSupportTotal}
          subtext="Lab, OT, Radiology, Reception, Housekeeping, Security"
          icon={<Wrench size={16} />}
        />
      </div>

      {/* Main Hospital Staff Roster & Onboarding Card */}
      <Card
        title="Hospital Staff Management Roster"
        subtitle="Recruit, assign wards &amp; shifts, and manage all hospital personnel (Nurses, Ward Boys, Ward Girls, Lab/OT Techs, Reception, Housekeeping, Security &amp; Support)"
        icon={<Users size={18} />}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStaffData}
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Refresh Staff Roster"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={handleOpenAddModal}
            >
              Add Hospital Staff
            </Button>
          </div>
        }
      >
        {/* Role Filter Chips */}
        <div className="space-y-3 pb-4 mb-4 border-b border-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ROLE_FILTER_CHIPS.map((chip) => {
              const count =
                chip.id === 'ALL'
                  ? staffList.length
                  : staffList.filter((s) => s.category === chip.id).length;
              // Always show core hospital presets (All, Nurse, Head Nurse, Ward Boy, Ward Girl, Lab Tech, Receptionist, Housekeeping, Security) + any category that currently has staff
              const isCorePreset = [
                'ALL',
                'NURSE',
                'HEAD_NURSE',
                'WARD_BOY',
                'WARD_GIRL',
                'LAB_TECHNICIAN',
                'OT_TECHNICIAN',
                'RECEPTIONIST',
                'HOUSEKEEPING',
                'SECURITY',
              ].includes(chip.id);
              if (!isCorePreset && count === 0 && categoryFilter !== chip.id) {
                return null;
              }
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategoryFilter(chip.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                    categoryFilter === chip.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground border-border'
                  }`}
                >
                  {chip.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search, Shift & Duty Status Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0 max-w-full">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, employee code, ward, department, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'ALL' | HospitalStaffCategory)
                }
                aria-label="Filter by staff role category"
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono cursor-pointer max-w-full"
              >
                <option value="ALL">All Role Categories</option>
                {HOSPITAL_STAFF_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.category} value={opt.category}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value as 'ALL' | StaffShift)}
                aria-label="Filter by duty shift"
                className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono cursor-pointer max-w-full"
              >
                <option value="ALL">All Shifts</option>
                {(Object.keys(STAFF_SHIFT_LABELS) as StaffShift[]).map((sh) => (
                  <option key={sh} value={sh}>
                    {STAFF_SHIFT_LABELS[sh]}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border max-w-full">
                {(['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                      statusFilter === st
                        ? 'bg-foreground text-background shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Staff Directory Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member &amp; Contact</TableHead>
              <TableHead>Hospital Role &amp; Title</TableHead>
              <TableHead>Department &amp; Assigned Ward</TableHead>
              <TableHead>Duty Shift</TableHead>
              <TableHead>Salary &amp; Qualification</TableHead>
              <TableHead>Duty Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((staff) => {
              const roleMeta = getStaffRoleMeta(staff.category);
              const isConfirmingDelete = confirmDeleteId === staff.id;

              return (
                <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {staff.firstName[0] || 'S'}
                        {staff.lastName[0] || 'T'}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                          <span>
                            {staff.firstName} {staff.lastName}
                          </span>
                          <span className="text-[0.62rem] font-mono px-1.5 py-0.2 rounded border border-border bg-muted text-muted-foreground">
                            {staff.employeeCode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Phone size={10} />
                            {staff.phoneNumber}
                          </span>
                          {staff.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail size={10} />
                              {staff.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[0.65rem] font-mono">
                        {roleMeta.shortLabel.toUpperCase()}
                      </Badge>
                      <div className="text-xs font-medium text-foreground">
                        {staff.designation}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs font-medium text-foreground">{staff.department}</div>
                    {staff.assignedWard && (
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {staff.assignedWard}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border border-border bg-secondary text-secondary-foreground">
                      <Clock size={10} />
                      {staff.shift}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-foreground">
                      {staff.monthlySalary ? `$${staff.monthlySalary.toFixed(2)}/mo` : '—'}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                      {staff.qualification || staff.gender}
                    </div>
                  </TableCell>

                  <TableCell>
                    <select
                      value={staff.status}
                      onChange={(e) =>
                        handleStatusChange(staff, e.target.value as HospitalStaffStatus)
                      }
                      aria-label={`Change duty status for ${staff.firstName} ${staff.lastName}`}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-pointer focus:outline-none ${
                        staff.status === 'ACTIVE'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : staff.status === 'ON_LEAVE'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(staff)}
                        className="p-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title="Edit Staff Details"
                      >
                        <Pencil size={12} />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            className="px-2 py-1 rounded-md bg-destructive text-destructive-foreground text-[11px] font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(staff.id)}
                          className="p-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Remove Staff Member"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredStaff.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Shield size={24} className="text-muted-foreground" />
                    <div className="text-xs font-semibold text-foreground">
                      {loading
                        ? 'Loading hospital staff directory...'
                        : staffList.length === 0
                          ? 'No Hospital Staff Added Yet'
                          : 'No Staff Members Match Current Filters'}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md">
                      {staffList.length === 0
                        ? 'Add Nurses, Ward Boys, Ward Girls, Lab Technicians, Receptionists, Housekeeping, Security, and any other hospital support roles.'
                        : 'Try clearing the role, shift, or search filters to view other hospital staff.'}
                    </p>
                    {staffList.length === 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={handleOpenAddModal}
                      >
                        Add First Hospital Staff
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Hospital Staff Modal */}
      <AddHospitalStaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }}
        onSaved={loadStaffData}
        editingStaff={editingStaff}
      />
    </div>
  );
};
