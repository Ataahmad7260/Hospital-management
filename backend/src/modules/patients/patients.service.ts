import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin: View all registered patients
   * Doctor: View only patients with whom this doctor has appointments, prescriptions, or medical records
   */
  async findAll(user?: any) {
    if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!doctorProfile) {
        return [];
      }

      return this.prisma.patientProfile.findMany({
        where: {
          OR: [
            { appointments: { some: { doctorId: doctorProfile.id } } },
            { prescriptions: { some: { doctorId: doctorProfile.id } } },
            { medicalRecords: { some: { doctorId: doctorProfile.id } } },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });
    }

    // Admin (or general authorized clinical listing)
    return this.prisma.patientProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
  }

  /**
   * Secure patient-specific endpoint returning only the authenticated patient's own permitted data
   */
  async findMyProfile(userId: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointments: {
          include: {
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { appointmentDate: 'desc' },
        },
        prescriptions: {
          include: {
            doctor: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
        bills: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found for the authenticated user');
    }

    return patient;
  }

  /**
   * Find patient by ID with strict role-based data isolation
   */
  async findOne(id: string, user?: any) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
        },
        medicalRecords: {
          orderBy: { createdAt: 'desc' },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Role-based authorization check
    if (user) {
      if (user.role === Role.PATIENT) {
        if (patient.userId !== user.id) {
          throw new ForbiddenException('Access denied: You can only view your own patient records');
        }
      } else if (user.role === Role.DOCTOR) {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
          where: { userId: user.id },
        });

        if (!doctorProfile) {
          throw new ForbiddenException('Doctor profile not found');
        }

        const isAuthorized =
          patient.appointments.some((a) => a.doctorId === doctorProfile.id) ||
          patient.prescriptions.some((p) => p.doctorId === doctorProfile.id) ||
          patient.medicalRecords.some((m) => m.doctorId === doctorProfile.id);

        if (!isAuthorized) {
          throw new ForbiddenException(
            'Access denied: You are not authorized to view this patient record as there is no active clinical consultation or record assigned to you',
          );
        }
      }
    }

    return patient;
  }
}
