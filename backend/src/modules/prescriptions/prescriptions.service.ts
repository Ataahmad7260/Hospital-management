import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrescriptionStatus } from '@prisma/client';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto) {
    const count = await this.prisma.prescription.count();
    const prescriptionNo = `RX-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

    return this.prisma.prescription.create({
      data: {
        prescriptionNo,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        medicalRecordId: dto.medicalRecordId,
        doctorNotes: dto.doctorNotes,
        status: PrescriptionStatus.ISSUED,
        items: dto.items.map((item) => ({
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          instructions: item.instructions || null,
          dispensed: false,
        })),
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.prescription.findMany({
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async dispense(prescriptionId: string, pharmacistId: string, itemsDispensed: string[], notes?: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    const updatedItems = prescription.items.map((it) => {
      if (itemsDispensed.includes(it.medicineName)) {
        return { ...it, dispensed: true };
      }
      return it;
    });

    const allDispensed = updatedItems.every((it) => it.dispensed);

    await this.prisma.dispensedLog.create({
      data: {
        prescriptionId,
        pharmacistId,
        dispensedItems: itemsDispensed,
        notes,
      },
    });

    return this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        items: updatedItems,
        status: allDispensed ? PrescriptionStatus.DISPENSED : PrescriptionStatus.PARTIALLY_DISPENSED,
      },
    });
  }
}
