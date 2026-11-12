import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role as PrismaRole } from '@prisma/client';

export const MAIN_ADMIN_EMAIL = 'ataah@gmail.com';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: PrismaRole, staffOnly = false) {
    if (staffOnly && role === PrismaRole.PATIENT) {
      return [];
    }

    const where = role
      ? { role }
      : staffOnly
        ? { role: { in: [PrismaRole.ADMIN, PrismaRole.DOCTOR, PrismaRole.PHARMACIST] } }
        : undefined;

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Root Hierarchy: Super Admin (ataah@gmail.com) is always placed first at index 0
    return users.sort((a, b) => {
      const isAMain = a.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
      const isBMain = b.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase();
      if (isAMain && !isBMain) return -1;
      if (!isAMain && isBMain) return 1;
      return 0;
    });
  }

  async getStats() {
    const [totalUsers, admins, doctors, patients, pharmacists] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: PrismaRole.ADMIN } }),
      this.prisma.user.count({ where: { role: PrismaRole.DOCTOR } }),
      this.prisma.user.count({ where: { role: PrismaRole.PATIENT } }),
      this.prisma.user.count({ where: { role: PrismaRole.PHARMACIST } }),
    ]);

    return {
      totalUsers,
      admins,
      doctors,
      patients,
      pharmacists,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: true,
        patientProfile: true,
        pharmacistProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async toggleActiveStatus(id: string, isActive: boolean) {
    const user = await this.findOne(id);

    // Root Security Protection: The Main Admin (ataah@gmail.com) can never be deactivated by any admin
    if (user.email.toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase() && !isActive) {
      throw new ForbiddenException(
        `Security Protection: The Main Administrator (${MAIN_ADMIN_EMAIL}) is permanently locked in active status and cannot be deactivated from the portal.`,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }
}
