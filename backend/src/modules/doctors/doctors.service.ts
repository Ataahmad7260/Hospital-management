import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { Role as PrismaRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    // Resolve Department if departmentName or departmentId provided
    let departmentId = dto.departmentId;
    if (!departmentId && dto.departmentName) {
      const code = dto.departmentName.slice(0, 4).toUpperCase() + '-01';
      const dept = await this.prisma.department.upsert({
        where: { code },
        update: { name: dto.departmentName },
        create: {
          name: dto.departmentName,
          code,
          description: `${dto.departmentName} Clinical Department`,
        },
      });
      departmentId = dept.id;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password || 'Hospital123!', saltRounds);
    const licenseNumber =
      dto.licenseNumber ||
      `MD-${dto.specialization.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        phoneNumber: dto.phoneNumber?.trim() || null,
        role: PrismaRole.DOCTOR,
        doctorProfile: {
          create: {
            specialization: dto.specialization.trim(),
            licenseNumber,
            qualifications:
              dto.qualifications && dto.qualifications.length > 0 ? dto.qualifications : ['MBBS'],
            consultationFee: dto.consultationFee ?? 50.0,
            roomNumber: dto.roomNumber?.trim() || 'Room 101',
            departmentId: departmentId || undefined,
            availableDays:
              dto.availableDays && dto.availableDays.length > 0
                ? dto.availableDays
                : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
        },
      },
      include: {
        doctorProfile: {
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
        },
      },
    });

    return user.doctorProfile;
  }

  async findAll(specialty?: string, isActive?: boolean) {
    const trimmedSpecialty = specialty?.trim();

    return this.prisma.doctorProfile.findMany({
      where: {
        ...(isActive !== undefined ? { user: { is: { isActive } } } : {}),
        ...(trimmedSpecialty
          ? {
              OR: [
                {
                  specialization: {
                    contains: trimmedSpecialty,
                    mode: 'insensitive',
                  },
                },
                {
                  department: {
                    is: {
                      name: {
                        contains: trimmedSpecialty,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAvailableToday(specialty?: string, isActive = true) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = daysOfWeek[new Date().getDay()];
    const trimmedSpecialty = specialty?.trim();

    const doctors = await this.prisma.doctorProfile.findMany({
      where: {
        user: { is: { isActive } },
        ...(trimmedSpecialty
          ? {
              OR: [
                {
                  specialization: {
                    contains: trimmedSpecialty,
                    mode: 'insensitive',
                  },
                },
                {
                  department: {
                    is: {
                      name: {
                        contains: trimmedSpecialty,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return doctors
      .filter((doc) => {
        // Return doctors available today, or all active specialists if days array not set
        if (!doc.availableDays || doc.availableDays.length === 0) return true;
        return doc.availableDays.some((d) => d.toLowerCase() === todayDay.toLowerCase());
      })
      .map((doc) => ({
        ...doc,
        todayDay,
      }));
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
