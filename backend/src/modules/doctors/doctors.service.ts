import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.doctorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
        department: true,
      },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
        department: true,
        appointments: {
          take: 10,
          orderBy: { appointmentDate: 'desc' },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with profile ID ${id} not found`);
    }

    return doctor;
  }
}
