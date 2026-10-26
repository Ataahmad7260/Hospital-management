import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto, user?: any) {
    let patientId = dto.patientId;

    if (user?.role === Role.PATIENT) {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!patientProfile) {
        throw new NotFoundException('Patient profile not found for the authenticated user');
      }
      patientId = patientProfile.id;
    }

    return this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        patientId,
        appointmentDate: new Date(dto.appointmentDate),
        timeSlot: dto.timeSlot,
        reason: dto.reason,
      },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findAll(user?: any) {
    let whereClause = {};

    if (user?.role === Role.PATIENT) {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      whereClause = { patientId: patientProfile ? patientProfile.id : '__none__' };
    } else if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      whereClause = { doctorId: doctorProfile ? doctorProfile.id : '__none__' };
    }

    return this.prisma.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }
}
