import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AppointmentStatus,
  BillCategory,
  BillStatus,
  PrescriptionStatus,
} from '@prisma/client';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { BillingService } from '../billing/billing.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async create(dto: CreatePrescriptionDto, user?: any) {
    let doctorId = dto.doctorId;

    if (!doctorId && user) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (doctorProfile) {
        doctorId = doctorProfile.id;
      }
    }

    if (!doctorId) {
      throw new NotFoundException('Doctor profile ID could not be resolved. Please specify doctorId.');
    }

    const items = (dto.items || []).filter((it) => it.medicineName && it.medicineName.trim().length > 0);
    const labTests = (dto.labTests || []).filter((t) => t.testName && t.testName.trim().length > 0);

    if (items.length === 0 && labTests.length === 0) {
      throw new BadRequestException('Please include at least one medication or lab/diagnostic test order.');
    }

    // Resolve and validate linked consultation / appointment
    let resolvedAppointment = null;
    if (dto.appointmentId?.trim()) {
      resolvedAppointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId.trim() },
      });
      if (!resolvedAppointment) {
        throw new NotFoundException(`Consultation ${dto.appointmentId} not found`);
      }
      if (resolvedAppointment.patientId !== dto.patientId) {
        throw new BadRequestException('Selected consultation does not match the prescribed patient');
      }
      if (user?.role === Role.DOCTOR && resolvedAppointment.doctorId !== doctorId) {
        throw new ForbiddenException('You can only link prescriptions to your own consultations');
      }
    } else {
      // Auto-link to the latest confirmed/active consultation for this patient + doctor pair
      resolvedAppointment =
        (await this.prisma.appointment.findFirst({
          where: {
            patientId: dto.patientId,
            doctorId,
            status: {
              in: [
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.REVIEW,
                AppointmentStatus.FOLLOW_UP,
                AppointmentStatus.PENDING,
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
        })) ||
        (await this.prisma.appointment.findFirst({
          where: {
            patientId: dto.patientId,
            doctorId,
          },
          orderBy: { createdAt: 'desc' },
        }));
    }

    // STAGE 1 ENFORCEMENT: Do not start a PENDING appointment if Consultation Fee is still unpaid
    if (resolvedAppointment && resolvedAppointment.status === AppointmentStatus.PENDING) {
      const feeCheck = await this.billingService.isConsultationFeePaid(resolvedAppointment.id);
      if (!feeCheck.paid) {
        throw new BadRequestException(
          `Cannot start consultation or issue prescription: Consultation booking fee ($${feeCheck.consultationFee.toFixed(
            2,
          )}) is still PENDING. The patient must settle consultation fee upfront before confirmation.`,
        );
      }
    }

    const year = new Date().getFullYear();
    const [count, latest] = await Promise.all([
      this.prisma.prescription.count(),
      this.prisma.prescription.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { prescriptionNo: true },
      }),
    ]);
    const latestSeq = latest?.prescriptionNo?.match(/(\d+)$/)?.[1]
      ? Number.parseInt(latest.prescriptionNo.match(/(\d+)$/)![1], 10)
      : 0;
    const nextSeq = Math.max(count, latestSeq) + 1;
    const prescriptionNo = `RX-${year}-${nextSeq.toString().padStart(5, '0')}`;

    const prescription = await this.prisma.prescription.create({
      data: {
        prescriptionNo,
        patientId: dto.patientId,
        doctorId,
        medicalRecordId: dto.medicalRecordId,
        appointmentId: resolvedAppointment?.id || null,
        doctorNotes: dto.doctorNotes?.trim() || null,
        status: PrescriptionStatus.ISSUED,
        items: items.map((item) => ({
          medicineName: item.medicineName.trim(),
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          durationDays: Number(item.durationDays),
          instructions: item.instructions?.trim() || null,
          dispensed: false,
        })),
        labTests: labTests.map((test) => ({
          testName: test.testName.trim(),
          urgency: test.urgency?.trim() || 'Routine',
          instructions: test.instructions?.trim() || null,
        })),
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } },
          },
        },
        appointment: {
          select: { id: true, appointmentDate: true, timeSlot: true, status: true },
        },
      },
    });

    // Advance confirmed/paid consultation -> IN_PROGRESS
    if (
      resolvedAppointment &&
      (resolvedAppointment.status === AppointmentStatus.CONFIRMED ||
        resolvedAppointment.status === AppointmentStatus.PENDING)
    ) {
      await this.prisma.appointment.update({
        where: { id: resolvedAppointment.id },
        data: { status: AppointmentStatus.IN_PROGRESS },
      });
    }

    // Two-Stage Billing: Doctor ONLY creates prescription; Stage 2 Pharmacy Bill is generated explicitly by the Pharmacist.
    return prescription;
  }

  async findAll(user?: any) {
    let whereClause = {};
    const isDoctor = user?.role === Role.DOCTOR;

    if (user?.role === Role.PATIENT) {
      whereClause = { patient: { userId: user.id } };
    } else if (isDoctor) {
      whereClause = { doctor: { userId: user.id } };
    }

    const list = await this.prisma.prescription.findMany({
      where: whereClause,
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } },
          },
        },
        appointment: {
          select: { id: true, appointmentDate: true, timeSlot: true, status: true },
        },
        ...(isDoctor
          ? {}
          : {
              bills: {
                where: { billType: BillCategory.PHARMACY },
                orderBy: { createdAt: 'desc' as const },
              },
            }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((rx: any) => {
      if (isDoctor) {
        const { bills: _omit, ...rest } = rx;
        return rest;
      }
      const pharmacyBill =
        (rx.bills || []).find(
          (b: any) => b.status !== BillStatus.CANCELLED && b.status !== BillStatus.REFUNDED,
        ) ||
        rx.bills?.[0] ||
        null;
      return {
        ...rx,
        pharmacyBill,
      };
    });
  }

  async dispense(prescriptionId: string, dto: DispensePrescriptionDto, user?: any) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        bills: {
          where: { billType: BillCategory.PHARMACY },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    if (prescription.status === PrescriptionStatus.DISPENSED) {
      throw new BadRequestException(`Prescription ${prescription.prescriptionNo} has already been dispensed`);
    }

    if (prescription.status === PrescriptionStatus.CANCELLED) {
      throw new BadRequestException(`Cannot dispense cancelled prescription ${prescription.prescriptionNo}`);
    }

    // STAGE 2 ENFORCEMENT: Require generated PHARMACY bill AND full patient payment BEFORE handover/dispense
    const pharmacyBill = (prescription.bills || []).find(
      (b) => b.status !== BillStatus.CANCELLED && b.status !== BillStatus.REFUNDED,
    );

    if (!pharmacyBill) {
      throw new BadRequestException(
        `Cannot hand over medicines for ${prescription.prescriptionNo}: No Pharmacy Medicine Bill has been generated yet. Click "Generate Medicine Bill" first.`,
      );
    }

    const remainingDue = Math.max(0, Number((pharmacyBill.totalAmount - (pharmacyBill.paidAmount || 0)).toFixed(2)));
    if (pharmacyBill.status !== BillStatus.PAID || remainingDue > 0.005) {
      throw new BadRequestException(
        `Cannot hand over / dispense medicines for ${prescription.prescriptionNo}: Pharmacy Bill ${pharmacyBill.invoiceNumber} ($${pharmacyBill.totalAmount.toFixed(
          2,
        )}) is ${pharmacyBill.status}. Patient must pay the Pharmacy Bill in the Patient Portal before dispensing.`,
      );
    }

    // Resolve actual PharmacistProfile ObjectId from authenticated user (with safe fallback)
    let resolvedPharmacistProfileId: string | null = null;
    if (user?.id) {
      const profileByUser = await this.prisma.pharmacistProfile.findUnique({
        where: { userId: user.id },
      });
      resolvedPharmacistProfileId = profileByUser?.id || null;
    }

    if (!resolvedPharmacistProfileId && dto.pharmacistId) {
      const profileById = await this.prisma.pharmacistProfile.findUnique({
        where: { id: dto.pharmacistId },
      });
      if (profileById) {
        resolvedPharmacistProfileId = profileById.id;
      } else {
        const profileByUserId = await this.prisma.pharmacistProfile.findUnique({
          where: { userId: dto.pharmacistId },
        });
        resolvedPharmacistProfileId = profileByUserId?.id || null;
      }
    }

    if (!resolvedPharmacistProfileId) {
      throw new NotFoundException('Pharmacist clinical profile not found for the current session');
    }

    const itemsDispensed = dto.itemsDispensed || [];
    const newlyDispensedItems: Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
    }> = [];

    const updatedItems = prescription.items.map((it) => {
      if (itemsDispensed.includes(it.medicineName)) {
        if (!it.dispensed) {
          newlyDispensedItems.push(it);
        }
        return { ...it, dispensed: true };
      }
      return it;
    });

    const allDispensed = updatedItems.every((it) => it.dispensed);

    // Decrement pharmacy inventory stock safely for newly dispensed medications
    if (newlyDispensedItems.length > 0) {
      const allMedicines = await this.prisma.medicine.findMany();
      const activeMedicines = allMedicines.filter((m) => m.isActive !== false);

      for (const item of newlyDispensedItems) {
        const matched = this.billingService.findMatchingMedicine(item.medicineName, activeMedicines);
        if (!matched) continue;

        const billedLine = (pharmacyBill.items || []).find((bi) =>
          bi.description.toLowerCase().includes(item.medicineName.toLowerCase()),
        );
        const estimatedQty = this.billingService.estimateMedicationPricing(item, matched).quantity;
        const deductUnits = Math.max(1, billedLine?.quantity ?? estimatedQty);
        const nextStock = Math.max(0, matched.stockQuantity - deductUnits);

        matched.stockQuantity = nextStock;
        await this.prisma.medicine.update({
          where: { id: matched.id },
          data: { stockQuantity: nextStock },
        });
      }
    }

    await this.prisma.dispensedLog.create({
      data: {
        prescriptionId,
        pharmacistId: resolvedPharmacistProfileId,
        dispensedItems: itemsDispensed,
        notes: dto.notes,
      },
    });

    const updated = await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        items: updatedItems,
        status: allDispensed ? PrescriptionStatus.DISPENSED : PrescriptionStatus.PARTIALLY_DISPENSED,
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            department: { select: { name: true, code: true } },
          },
        },
        appointment: {
          select: { id: true, appointmentDate: true, timeSlot: true, status: true },
        },
        bills: {
          where: { billType: BillCategory.PHARMACY },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return {
      ...updated,
      pharmacyBill: updated.bills?.[0] || pharmacyBill,
    };
  }
}
