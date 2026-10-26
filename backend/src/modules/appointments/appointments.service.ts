import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        patientId: dto.patientId,
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

  async findAll() {
    return this.prisma.appointment.findMany({
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
    });
  }
}
