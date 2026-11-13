import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Building2,
  DollarSign,
  Calendar,
  RefreshCw,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
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
import type { Doctor } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';
import { AddDoctorModal } from '../components/AddDoctorModal';

interface Props {
  onAddDoctorClick?: () => void;
}

export const DoctorsManagementPage: React.FC<Props> = () => {
  const { showToast } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctors();
      setDoctors(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load doctors list', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (doctor: Doctor) => {
    const targetUserId = doctor.user?.id || doctor.userId;
    if (!targetUserId) {
      showToast('Cannot toggle status: Missing user ID', true);
      return;
    }

    const currentStatus = doctor.user ? (doctor.user as any).isActive !== false : true;
    try {
      await api.toggleUserStatus(targetUserId, !currentStatus);
      showToast(
        `Doctor ${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''} account is now ${
          !currentStatus ? 'Active' : 'Suspended'
        }`
      );
      loadDoctors();
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor status', true);
    }
  };

  // Unique departments for filter
  const departments = React.useMemo(() => {
    const depts = new Set<string>();
    doctors.forEach((d) => {
      const deptName = d.department?.name || d.specialization;
      if (deptName) depts.add(deptName);
    });
    return Array.from(depts);
  }, [doctors]);

  const filteredDoctors = React.useMemo(() => {
    return doctors.filter((doc) => {
      const fullName = `${doc.user?.firstName || ''} ${doc.user?.lastName || ''}`.toLowerCase();
      const email = (doc.user?.email || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      const lic = (doc.licenseNumber || '').toLowerCase();
      const q = search.toLowerCase();

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || spec.includes(q) || lic.includes(q);
      const matchesDept =
        departmentFilter === 'ALL' ||
        (doc.department?.name || doc.specialization) === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [doctors, search, departmentFilter]);

  const avgConsultationFee = React.useMemo(() => {
    if (doctors.length === 0) return 0;
    const total = doctors.reduce((sum, d) => sum + (Number(d.consultationFee) || 0), 0);
    return Math.round(total / doctors.length);
  }, [doctors]);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Roster Physicians</span>
            <Stethoscope size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{doctors.length}</div>
          <p className="text-[11px] text-muted-foreground">Certified clinical staff members</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Clinical Departments</span>
            <Building2 size={15} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{departments.length || 1}</div>
          <p className="text-[11px] text-muted-foreground">Specializations recognized</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Avg. Consultation Fee</span>
            <DollarSign size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">${avgConsultationFee}</div>
          <p className="text-[11px] text-muted-foreground">Standard specialist outpatient rate</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-mono uppercase">
            <span>Weekly Availability</span>
            <Calendar size={15} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">7 Days / Week</div>
          <p className="text-[11px] text-muted-foreground">Continuous specialist coverage</p>
        </div>
      </div>

      {/* Main CRUD Card */}
      <Card
        title="Physicians & Specialist Directory"
        subtitle="Manage hospital faculty, department assignments, consultation fees, and appointment schedules"
        icon={<Stethoscope size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={loadDoctors}
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              title="Refresh Roster"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsAddDoctorModalOpen(true)}
            >
              Add New Doctor
            </Button>
          </div>
        }
      >
        {/* Search & Department Filters Strip */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4 border-b border-border min-w-0 max-w-full">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, specialization, or license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hidden min-w-0 max-w-full pb-1 sm:pb-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">Dept:</span>
            <button
              onClick={() => setDepartmentFilter('ALL')}
              className={`px-3 py-1.5 min-h-[38px] sm:min-h-8 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center ${
                departmentFilter === 'ALL'
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'border border-border text-muted-foreground hover:text-foreground bg-card'
              }`}
            >
              All Departments
            </button>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 min-h-[38px] sm:min-h-8 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center ${
                  departmentFilter === dept
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'border border-border text-muted-foreground hover:text-foreground bg-card'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Physician Details</TableHead>
              <TableHead>Department & Specialization</TableHead>
              <TableHead>License & Room</TableHead>
              <TableHead>Fee Schedule</TableHead>
              <TableHead>Scheduled Days</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead>Administrative Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                  {loading ? 'Loading certified physician roster...' : 'No doctors found matching criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDoctors.map((doc) => {
                const isActive = (doc.user as any)?.isActive !== false;
                const availableDays = Array.isArray(doc.availableDays) ? doc.availableDays : [];

                return (
                  <TableRow key={doc.id}>
                    {/* Physician Details */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 text-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          {doc.user?.firstName?.[0] || 'D'}
                          {doc.user?.lastName?.[0] || 'R'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-xs">
                            Dr. {doc.user?.firstName} {doc.user?.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail size={10} />
                              {doc.user?.email}
                            </span>
                            {doc.user?.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone size={10} />
                                {doc.user?.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Department & Specialization */}
                    <TableCell>
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          {doc.specialization || 'General Medicine'}
                        </span>
                        {doc.department && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {doc.department.name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* License & Room */}
                    <TableCell>
                      <div className="space-y-0.5 font-mono text-xs">
                        <div className="text-foreground font-semibold">{doc.licenseNumber || 'MED-REG-LIC'}</div>
                        <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                          <Clock size={10} />
                          {doc.roomNumber || 'Consultation Suite 101'}
                        </div>
                      </div>
                    </TableCell>

                    {/* Fee */}
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-foreground">
                        ${doc.consultationFee || 75}.00
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">per consult</div>
                    </TableCell>

                    {/* Scheduled Days */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {availableDays.length > 0 ? (
                          availableDays.map((day, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono border border-border bg-secondary text-secondary-foreground"
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Mon-Fri standard</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-mono font-semibold py-0.5 px-2 ${
                          isActive
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-destructive/30 bg-destructive/10 text-destructive'
                        }`}
                      >
                        {isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`text-xs px-3 py-1.5 min-h-[38px] sm:min-h-8 rounded-md border font-medium transition-colors cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorModalOpen}
        onClose={() => setIsAddDoctorModalOpen(false)}
        onDoctorAdded={() => {
          loadDoctors();
          showToast('Doctor successfully added to medical faculty roster');
        }}
      />
    </div>
  );
};
