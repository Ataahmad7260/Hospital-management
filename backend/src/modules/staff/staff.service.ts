import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Gender,
  HospitalStaffCategory,
  HospitalStaffStatus,
  Prisma,
  StaffShift,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHospitalStaffDto } from './dto/create-hospital-staff.dto';
import { UpdateHospitalStaffDto } from './dto/update-hospital-staff.dto';

const CATEGORY_DEFAULT_LABELS: Record<HospitalStaffCategory, { label: string; prefix: string }> = {
  NURSE: { label: 'Staff Nurse', prefix: 'NUR' },
  HEAD_NURSE: { label: 'Head Nurse / Nursing Supervisor', prefix: 'HNR' },
  MIDWIFE: { label: 'Midwife / Maternity Nurse', prefix: 'MWF' },
  WARD_BOY: { label: 'Ward Boy', prefix: 'WRB' },
  WARD_GIRL: { label: 'Ward Girl', prefix: 'WRG' },
  LAB_TECHNICIAN: { label: 'Lab Technician', prefix: 'LAB' },
  RADIOLOGY_TECHNICIAN: { label: 'Radiology / X-Ray Technician', prefix: 'RAD' },
  OT_TECHNICIAN: { label: 'OT Technician', prefix: 'OTT' },
  PHARMACY_ASSISTANT: { label: 'Pharmacy Assistant', prefix: 'PHA' },
  PARAMEDIC: { label: 'Paramedic / Ambulance EMT', prefix: 'EMT' },
  PHYSIOTHERAPIST: { label: 'Physiotherapist', prefix: 'PHY' },
  RECEPTIONIST: { label: 'Receptionist / Front Desk', prefix: 'RCP' },
  BILLING_CLERK: { label: 'Billing & Insurance Clerk', prefix: 'BIL' },
  HOUSEKEEPING: { label: 'Housekeeping / Sanitation Staff', prefix: 'HSK' },
  SECURITY: { label: 'Hospital Security Officer', prefix: 'SEC' },
  ADMIN_STAFF: { label: 'Hospital Administrative Staff', prefix: 'ADM' },
  OTHER: { label: 'Hospital Support Staff', prefix: 'GEN' },
};

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateUniqueEmployeeCode(category: HospitalStaffCategory): Promise<string> {
    const prefix = CATEGORY_DEFAULT_LABELS[category]?.prefix || 'STF';
    for (let attempt = 0; attempt < 10; attempt++) {
      const num = Math.floor(1000 + Math.random() * 9000);
      const code = `STF-${prefix}-${num}`;
      const existing = await this.prisma.hospitalStaff.findUnique({ where: { employeeCode: code } });
      if (!existing) return code;
    }
    return `STF-${prefix}-${Date.now().toString().slice(-6)}`;
  }

  async create(dto: CreateHospitalStaffDto) {
    const employeeCode = dto.employeeCode
      ? dto.employeeCode.toUpperCase()
      : await this.generateUniqueEmployeeCode(dto.category);

    const duplicateCode = await this.prisma.hospitalStaff.findUnique({
      where: { employeeCode },
    });
    if (duplicateCode) {
      throw new ConflictException(`Staff member with employee code '${employeeCode}' already exists`);
    }

    if (dto.email) {
      const existingEmail = await this.prisma.hospitalStaff.findFirst({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new ConflictException(`Staff member with email '${dto.email}' already exists`);
      }
    }

    const defaultGender =
      dto.category === HospitalStaffCategory.WARD_GIRL
        ? Gender.FEMALE
        : dto.category === HospitalStaffCategory.WARD_BOY
          ? Gender.MALE
          : Gender.OTHER;

    return this.prisma.hospitalStaff.create({
      data: {
        employeeCode,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        category: dto.category,
        designation: dto.designation?.trim() || CATEGORY_DEFAULT_LABELS[dto.category]?.label || 'Hospital Staff',
        gender: dto.gender ?? defaultGender,
        phoneNumber: dto.phoneNumber.trim(),
        email: dto.email?.toLowerCase() || null,
        department: dto.department.trim(),
        assignedWard: dto.assignedWard?.trim() || null,
        shift: dto.shift ?? StaffShift.MORNING,
        qualification: dto.qualification?.trim() || null,
        monthlySalary: dto.monthlySalary !== undefined ? Number(dto.monthlySalary) : null,
        emergencyContact: dto.emergencyContact?.trim() || null,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : new Date(),
        status: dto.status ?? HospitalStaffStatus.ACTIVE,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async findAll(filters?: {
    category?: HospitalStaffCategory;
    status?: HospitalStaffStatus;
    shift?: StaffShift;
    search?: string;
  }) {
    const where: Prisma.HospitalStaffWhereInput = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.shift) where.shift = filters.shift;

    const q = filters?.search?.trim();
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { assignedWard: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.hospitalStaff.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const allStaff = await this.prisma.hospitalStaff.findMany({
      select: {
        id: true,
        category: true,
        status: true,
        shift: true,
      },
    });

    const byCategory: Record<string, number> = {};
    const byShift: Record<string, number> = {};
    let active = 0;
    let onLeave = 0;
    let inactive = 0;

    for (const s of allStaff) {
      byCategory[s.category] = (byCategory[s.category] || 0) + 1;
      byShift[s.shift] = (byShift[s.shift] || 0) + 1;
      if (s.status === HospitalStaffStatus.ACTIVE) active += 1;
      else if (s.status === HospitalStaffStatus.ON_LEAVE) onLeave += 1;
      else inactive += 1;
    }

    const nursesCount =
      (byCategory[HospitalStaffCategory.NURSE] || 0) +
      (byCategory[HospitalStaffCategory.HEAD_NURSE] || 0) +
      (byCategory[HospitalStaffCategory.MIDWIFE] || 0);
    const wardAttendantsCount =
      (byCategory[HospitalStaffCategory.WARD_BOY] || 0) +
      (byCategory[HospitalStaffCategory.WARD_GIRL] || 0);
    const techniciansCount =
      (byCategory[HospitalStaffCategory.LAB_TECHNICIAN] || 0) +
      (byCategory[HospitalStaffCategory.RADIOLOGY_TECHNICIAN] || 0) +
      (byCategory[HospitalStaffCategory.OT_TECHNICIAN] || 0) +
      (byCategory[HospitalStaffCategory.PHARMACY_ASSISTANT] || 0) +
      (byCategory[HospitalStaffCategory.PARAMEDIC] || 0) +
      (byCategory[HospitalStaffCategory.PHYSIOTHERAPIST] || 0);
    const supportOpsCount =
      allStaff.length - nursesCount - wardAttendantsCount - techniciansCount;

    return {
      total: allStaff.length,
      active,
      onLeave,
      inactive,
      groups: {
        nurses: nursesCount,
        wardAttendants: wardAttendantsCount,
        wardBoys: byCategory[HospitalStaffCategory.WARD_BOY] || 0,
        wardGirls: byCategory[HospitalStaffCategory.WARD_GIRL] || 0,
        techniciansAndAllied: techniciansCount,
        supportAndOperations: Math.max(0, supportOpsCount),
      },
      byCategory,
      byShift,
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.hospitalStaff.findUnique({ where: { id } });
    if (!staff) {
      throw new NotFoundException(`Hospital staff member with ID ${id} not found`);
    }
    return staff;
  }

  async update(id: string, dto: UpdateHospitalStaffDto) {
    const existing = await this.findOne(id);

    if (dto.employeeCode && dto.employeeCode.toUpperCase() !== existing.employeeCode) {
      const codeOwner = await this.prisma.hospitalStaff.findUnique({
        where: { employeeCode: dto.employeeCode.toUpperCase() },
      });
      if (codeOwner && codeOwner.id !== id) {
        throw new ConflictException(`Employee code '${dto.employeeCode}' is already in use`);
      }
    }

    if (dto.email && dto.email.toLowerCase() !== (existing.email || '').toLowerCase()) {
      const emailOwner = await this.prisma.hospitalStaff.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: id } },
      });
      if (emailOwner) {
        throw new ConflictException(`Email '${dto.email}' is already assigned to another staff member`);
      }
    }

    return this.prisma.hospitalStaff.update({
      where: { id },
      data: {
        ...(dto.employeeCode !== undefined && { employeeCode: dto.employeeCode.toUpperCase() }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.designation !== undefined && { designation: dto.designation.trim() }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber.trim() }),
        ...(dto.email !== undefined && { email: dto.email ? dto.email.toLowerCase() : null }),
        ...(dto.department !== undefined && { department: dto.department.trim() }),
        ...(dto.assignedWard !== undefined && { assignedWard: dto.assignedWard || null }),
        ...(dto.shift !== undefined && { shift: dto.shift }),
        ...(dto.qualification !== undefined && { qualification: dto.qualification || null }),
        ...(dto.monthlySalary !== undefined && { monthlySalary: Number(dto.monthlySalary) }),
        ...(dto.emergencyContact !== undefined && { emergencyContact: dto.emergencyContact || null }),
        ...(dto.joiningDate !== undefined && { joiningDate: new Date(dto.joiningDate) }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
      },
    });
  }

  async updateStatus(id: string, status: HospitalStaffStatus) {
    await this.findOne(id);
    return this.prisma.hospitalStaff.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.hospitalStaff.delete({ where: { id } });
    return { deleted: true, id };
  }
}

