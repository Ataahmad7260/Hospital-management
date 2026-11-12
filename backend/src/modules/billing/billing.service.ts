import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AppointmentStatus,
  BillCategory,
  BillStatus,
  Medicine,
  PaymentMethod,
  PrescriptionStatus,
} from '@prisma/client';
import { CreateBillDto } from './dto/create-bill.dto';
import { GeneratePharmacyBillDto } from './dto/generate-pharmacy-bill.dto';
import { Role } from '../../common/enums/role.enum';

export const BILL_INCLUDE = {
  patient: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  },
  appointment: {
    select: {
      id: true,
      appointmentDate: true,
      timeSlot: true,
      status: true,
      reason: true,
      doctor: {
        select: {
          id: true,
          specialization: true,
          consultationFee: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
  prescription: {
    select: {
      id: true,
      prescriptionNo: true,
      status: true,
      createdAt: true,
      items: true,
      doctor: {
        select: {
          id: true,
          specialization: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
};

const DEFAULT_UNLISTED_MEDICATION_FEE = 15.0;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) { }

  private roundCurrency(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private async generateNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [count, latest] = await Promise.all([
      this.prisma.bill.count(),
      this.prisma.bill.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      }),
    ]);
    const latestSeq = latest?.invoiceNumber?.match(/(\d+)$/)?.[1]
      ? Number.parseInt(latest.invoiceNumber.match(/(\d+)$/)![1], 10)
      : 0;
    const nextSeq = Math.max(count, latestSeq) + 1;
    return `INV-${year}-${nextSeq.toString().padStart(5, '0')}`;
  }

  findMatchingMedicine(medicineName: string, medicines: Medicine[]): Medicine | null {
    const query = medicineName.trim().toLowerCase();
    if (!query) return null;

    const exact = medicines.find(
      (m) =>
        m.name.toLowerCase() === query ||
        (m.genericName && m.genericName.toLowerCase() === query),
    );
    if (exact) return exact;

    const sortedByNameLen = [...medicines].sort((a, b) => b.name.length - a.name.length);
    const partial = sortedByNameLen.find((m) => {
      const name = m.name.toLowerCase();
      const generic = m.genericName?.toLowerCase() || '';
      const queryBase = query.split(/\s+/)[0] || '';
      const medBase = name.split(/\s+/)[0] || '';
      return (
        (name.length >= 4 && (query.includes(name) || name.includes(query))) ||
        (generic.length >= 4 && (query.includes(generic) || generic.includes(query))) ||
        (queryBase.length >= 4 &&
          medBase.length >= 4 &&
          (queryBase === medBase || medBase.startsWith(queryBase)))
      );
    });

    return partial || null;
  }

  estimateMedicationPricing(
    item: { medicineName: string; dosage: string; frequency: string; durationDays: number },
    matchedMedicine: Medicine | null,
  ): { quantity: number; unitPrice: number; sourceLabel: string; inInventory: boolean } {
    const safeDays = Math.max(1, Math.min(365, Math.round(Number(item.durationDays) || 1)));

    if (!matchedMedicine) {
      return {
        quantity: 1,
        unitPrice: DEFAULT_UNLISTED_MEDICATION_FEE,
        sourceLabel: 'Dispensary Standard (Unlisted)',
        inInventory: false,
      };
    }

    const combinedText = `${matchedMedicine.category || ''} ${matchedMedicine.name} ${item.medicineName} ${item.dosage}`.toLowerCase();
    const isContainerForm =
      /\b(syrup|suspension|solution|drop|drops|ointment|cream|gel|lotion|inhaler|spray|vial|injection|ml)\b/.test(
        combinedText,
      );

    if (isContainerForm) {
      return {
        quantity: Math.max(1, Math.ceil(safeDays / 14)),
        unitPrice: this.roundCurrency(matchedMedicine.unitPrice),
        sourceLabel: matchedMedicine.name,
        inInventory: true,
      };
    }

    const freq = (item.frequency || '').toLowerCase();
    let dosesPerDay = 1;

    const hyphenPattern = freq.match(/\b(\d+)\s*-\s*(\d+)\s*-\s*(\d+)(?:\s*-\s*(\d+))?\b/);
    if (hyphenPattern) {
      const sum =
        Number(hyphenPattern[1]) +
        Number(hyphenPattern[2]) +
        Number(hyphenPattern[3]) +
        (hyphenPattern[4] ? Number(hyphenPattern[4]) : 0);
      if (sum > 0) dosesPerDay = Math.min(8, sum);
    } else if (/\b(qid|four times|4x|4\/day|4 times)\b/.test(freq)) {
      dosesPerDay = 4;
    } else if (/\b(tid|tds|thrice|three times|3x|3\/day|3 times|every 8 hours)\b/.test(freq)) {
      dosesPerDay = 3;
    } else if (/\b(bid|bd|twice|two times|2x|2\/day|2 times|every 12 hours)\b/.test(freq)) {
      dosesPerDay = 2;
    } else {
      const slashMatch = freq.match(/\b(\d+)\s*\/\s*day\b/);
      if (slashMatch) {
        dosesPerDay = Math.max(1, Math.min(8, Number(slashMatch[1])));
      }
    }

    return {
      quantity: Math.max(1, safeDays * dosesPerDay),
      unitPrice: this.roundCurrency(matchedMedicine.unitPrice),
      sourceLabel: matchedMedicine.name,
      inInventory: true,
    };
  }

  /**
   * STAGE 1: Creates the Consultation Fee invoice upon appointment booking.
   * If payUpfront === true (or doctor consultationFee === 0), immediately marks bill PAID
   * and transitions the appointment from PENDING -> CONFIRMED.
   */
  async createConsultationBookingBill(params: {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    payUpfront?: boolean;
    paymentMethod?: PaymentMethod;
  }) {
    const existing = await this.prisma.bill.findFirst({
      where: {
        appointmentId: params.appointmentId,
        billType: BillCategory.CONSULTATION,
        status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
      },
      include: BILL_INCLUDE,
    });
    if (existing) {
      return existing;
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: params.doctorId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    const fee = this.roundCurrency(Math.max(0, doctor?.consultationFee ?? 0));
    const docName = doctor?.user
      ? `Dr. ${[doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(' ').trim()}`
      : 'Attending Physician';
    const docSpec = doctor?.specialization ? ` (${doctor.specialization})` : '';

    const isSettledOnCreation = fee <= 0 || Boolean(params.payUpfront);
    const chosenMethod = params.paymentMethod ?? PaymentMethod.CARD;

    const items = [
      {
        description: `Consultation Fee — ${docName}${docSpec}`,
        quantity: 1,
        unitPrice: fee,
        total: fee,
      },
    ];

    for (let attempt = 0; attempt < 3; attempt++) {
      const invoiceNumber = await this.generateNextInvoiceNumber();
      try {
        const bill = await this.prisma.bill.create({
          data: {
            invoiceNumber,
            billType: BillCategory.CONSULTATION,
            patientId: params.patientId,
            appointmentId: params.appointmentId,
            prescriptionId: null,
            items,
            subtotal: fee,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: fee,
            paidAmount: isSettledOnCreation ? fee : 0,
            status: isSettledOnCreation ? BillStatus.PAID : BillStatus.PENDING,
            paidAt: isSettledOnCreation ? new Date() : null,
            paymentMethod: chosenMethod,
          },
          include: BILL_INCLUDE,
        });

        if (isSettledOnCreation) {
          await this.prisma.appointment.updateMany({
            where: {
              id: params.appointmentId,
              status: AppointmentStatus.PENDING,
            },
            data: { status: AppointmentStatus.CONFIRMED },
          });
        }

        return bill;
      } catch (err: any) {
        if (err?.code === 'P2002') {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException('Unable to allocate unique invoice number; please retry');
  }

  /**
   * Checks whether an appointment's Stage 1 Consultation Fee is settled.
   * Ensures any PENDING consultation with fee > 0 has a tracked CONSULTATION bill.
   */
  async isConsultationFeePaid(appointmentId: string): Promise<{
    paid: boolean;
    bill: any;
    consultationFee: number;
  }> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, consultationFee: true } },
        bills: {
          where: {
            billType: BillCategory.CONSULTATION,
            status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }

    const consultationFee = this.roundCurrency(Math.max(0, appointment.doctor?.consultationFee ?? 0));
    let consultBill = appointment.bills?.[0] || null;

    if (!consultBill && appointment.status === AppointmentStatus.PENDING && consultationFee > 0) {
      consultBill = await this.createConsultationBookingBill({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        payUpfront: false,
      });
    }

    if (consultBill) {
      return {
        paid: consultBill.status === BillStatus.PAID,
        bill: consultBill,
        consultationFee,
      };
    }

    // No bill exists: either fee is $0 or non-PENDING ER/admitted walk-in
    const paid = appointment.status !== AppointmentStatus.PENDING || consultationFee <= 0;
    return { paid, bill: null, consultationFee };
  }

  /**
   * STAGE 2 (Preview): Calculates itemized medication pricing directly from MongoDB `medicines` inventory.
   */
  async previewPharmacyBillForPrescription(prescriptionId: string) {
    const [prescription, allMedicines] = await Promise.all([
      this.prisma.prescription.findUnique({
        where: { id: prescriptionId },
        include: {
          patient: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          appointment: {
            select: { id: true, appointmentDate: true, timeSlot: true, status: true },
          },
          bills: {
            where: {
              billType: BillCategory.PHARMACY,
              status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
            },
            orderBy: { createdAt: 'desc' },
            include: BILL_INCLUDE,
          },
        },
      }),
      this.prisma.medicine.findMany(),
    ]);

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }

    const activeMedicines = allMedicines.filter((m) => m.isActive !== false);
    const rxItems = prescription.items || [];
    const existingBill = prescription.bills?.[0] || null;

    const previewItems = rxItems.map((med) => {
      const matched = this.findMatchingMedicine(med.medicineName, activeMedicines);
      const pricing = this.estimateMedicationPricing(med, matched);
      const total = this.roundCurrency(pricing.quantity * pricing.unitPrice);

      return {
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        durationDays: med.durationDays,
        matchedMedicineId: matched?.id || null,
        matchedMedicineName: matched?.name || null,
        category: matched?.category || null,
        stockQuantity: matched ? matched.stockQuantity : null,
        inInventory: pricing.inInventory,
        quantity: pricing.quantity,
        unitPrice: pricing.unitPrice,
        total,
        description: `Medicine: ${med.medicineName} (${med.dosage}, ${med.frequency}, ${med.durationDays}d • ${pricing.sourceLabel} — ${prescription.prescriptionNo})`,
      };
    });

    const subtotal = this.roundCurrency(previewItems.reduce((sum, it) => sum + it.total, 0));

    return {
      prescriptionId: prescription.id,
      prescriptionNo: prescription.prescriptionNo,
      prescriptionStatus: prescription.status,
      patientId: prescription.patientId,
      patientName: prescription.patient?.user
        ? `${prescription.patient.user.firstName} ${prescription.patient.user.lastName}`.trim()
        : 'Patient',
      doctorName: prescription.doctor?.user
        ? `Dr. ${[prescription.doctor.user.firstName, prescription.doctor.user.lastName].filter(Boolean).join(' ').trim()}`
        : 'Attending Physician',
      appointmentId: prescription.appointmentId,
      existingBill,
      items: previewItems,
      subtotal,
    };
  }

  /**
   * STAGE 2 (Create): Pharmacist generates a dedicated PHARMACY bill for a prescription
   * pulling live medicine prices from MongoDB inventory. Patient must settle before dispensing.
   */
  async generatePharmacyBillForPrescription(
    prescriptionId: string,
    dto?: GeneratePharmacyBillDto,
  ) {
    const preview = await this.previewPharmacyBillForPrescription(prescriptionId);

    if (preview.prescriptionStatus === PrescriptionStatus.CANCELLED) {
      throw new BadRequestException('Cannot generate a medicine bill for a cancelled prescription');
    }

    if (preview.existingBill) {
      throw new ConflictException(
        `Pharmacy bill ${preview.existingBill.invoiceNumber} has already been generated for ${preview.prescriptionNo}`,
      );
    }

    if (preview.items.length === 0) {
      throw new BadRequestException(
        `Prescription ${preview.prescriptionNo} contains no prescribed medicines to bill.`,
      );
    }

    const overrideMap = new Map<string, number>();
    for (const ov of dto?.items || []) {
      if (ov.medicineName && ov.quantity && ov.quantity >= 1) {
        overrideMap.set(ov.medicineName.trim().toLowerCase(), Math.round(ov.quantity));
      }
    }

    const billItems = preview.items.map((item) => {
      const overriddenQty = overrideMap.get(item.medicineName.trim().toLowerCase());
      const quantity = overriddenQty && overriddenQty >= 1 ? overriddenQty : item.quantity;
      const unitPrice = this.roundCurrency(item.unitPrice);
      const total = this.roundCurrency(quantity * unitPrice);

      return {
        description: item.description,
        quantity,
        unitPrice,
        total,
      };
    });

    const subtotal = this.roundCurrency(billItems.reduce((sum, it) => sum + it.total, 0));
    const taxRate = Math.max(0, Math.min(30, Number(dto?.taxRate ?? 0)));
    const taxAmount = this.roundCurrency((subtotal * taxRate) / 100);
    const discountAmount = this.roundCurrency(Math.max(0, Number(dto?.discountAmount ?? 0)));
    const totalAmount = this.roundCurrency(Math.max(0, subtotal + taxAmount - discountAmount));

    const isZeroBill = totalAmount <= 0;

    for (let attempt = 0; attempt < 3; attempt++) {
      const invoiceNumber = await this.generateNextInvoiceNumber();
      try {
        return await this.prisma.bill.create({
          data: {
            invoiceNumber,
            billType: BillCategory.PHARMACY,
            patientId: preview.patientId,
            appointmentId: preview.appointmentId || null,
            prescriptionId: preview.prescriptionId,
            items: billItems,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paidAmount: 0,
            status: isZeroBill ? BillStatus.PAID : BillStatus.PENDING,
            paidAt: isZeroBill ? new Date() : null,
            paymentMethod: PaymentMethod.ONLINE,
          },
          include: BILL_INCLUDE,
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException('Unable to allocate unique invoice number; please retry');
  }

  async create(dto: CreateBillDto) {
    const billType = dto.billType ?? BillCategory.OTHER;

    if (billType === BillCategory.CONSULTATION && dto.appointmentId) {
      const existingConsult = await this.prisma.bill.findFirst({
        where: {
          appointmentId: dto.appointmentId,
          billType: BillCategory.CONSULTATION,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
        },
      });
      if (existingConsult) {
        throw new ConflictException(
          `Consultation invoice ${existingConsult.invoiceNumber} already exists for this appointment`,
        );
      }
    }

    if (billType === BillCategory.PHARMACY && dto.prescriptionId) {
      const existingPharmacy = await this.prisma.bill.findFirst({
        where: {
          prescriptionId: dto.prescriptionId,
          billType: BillCategory.PHARMACY,
          status: { notIn: [BillStatus.CANCELLED, BillStatus.REFUNDED] },
        },
      });
      if (existingPharmacy) {
        throw new ConflictException(
          `Pharmacy invoice ${existingPharmacy.invoiceNumber} already exists for this prescription`,
        );
      }
    }

    const invoiceNumber = await this.generateNextInvoiceNumber();
    const tax = this.roundCurrency(dto.taxAmount ?? 0);
    const discount = this.roundCurrency(dto.discountAmount ?? 0);
    const subtotal = this.roundCurrency(dto.subtotal);
    const totalAmount = this.roundCurrency(Math.max(0, subtotal + tax - discount));

    return this.prisma.bill.create({
      data: {
        invoiceNumber,
        billType,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId || null,
        prescriptionId: dto.prescriptionId || null,
        items: dto.items,
        subtotal,
        taxAmount: tax,
        discountAmount: discount,
        totalAmount,
        paidAmount: 0,
        status: totalAmount <= 0 ? BillStatus.PAID : BillStatus.PENDING,
        paidAt: totalAmount <= 0 ? new Date() : null,
        paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
      },
      include: BILL_INCLUDE,
    });
  }

  async findAll(user?: any) {
    let whereClause = {};

    if (user?.role === Role.PATIENT) {
      whereClause = { patient: { userId: user.id } };
    }

    return this.prisma.bill.findMany({
      where: whereClause,
      include: BILL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(
    id: string,
    paidAmount: number,
    paymentMethod?: PaymentMethod,
    user?: any,
  ) {
    const amount = Number(paidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        patient: { select: { userId: true } },
      },
    });
    if (!bill) throw new NotFoundException(`Bill with ID ${id} not found`);

    if (
      user?.role === Role.PATIENT &&
      String(bill.patient?.userId || '') !== String(user.id || '')
    ) {
      throw new ForbiddenException('Access denied: You can only pay your own invoices');
    }

    const remaining = this.roundCurrency(Math.max(0, bill.totalAmount - bill.paidAmount));
    if (bill.status === BillStatus.PAID && remaining <= 0) {
      throw new BadRequestException(`Invoice ${bill.invoiceNumber} is already paid in full`);
    }

    const appliedPayment = Math.min(remaining > 0 ? remaining : bill.totalAmount, amount);
    const newPaid = this.roundCurrency(
      Math.min(bill.totalAmount, bill.paidAmount + appliedPayment),
    );
    const isFull = newPaid >= this.roundCurrency(bill.totalAmount - 0.005);

    const updated = await this.prisma.bill.update({
      where: { id },
      data: {
        paidAmount: isFull ? this.roundCurrency(bill.totalAmount) : newPaid,
        status: isFull ? BillStatus.PAID : BillStatus.PARTIALLY_PAID,
        paidAt: isFull ? new Date() : bill.paidAt,
        ...(paymentMethod && { paymentMethod }),
      },
      include: BILL_INCLUDE,
    });

    // STAGE 1 ENFORCEMENT: Settling Consultation Booking Bill confirms PENDING appointment
    if (
      isFull &&
      updated.billType === BillCategory.CONSULTATION &&
      updated.appointmentId
    ) {
      const result = await this.prisma.appointment.updateMany({
        where: {
          id: updated.appointmentId,
          status: AppointmentStatus.PENDING,
        },
        data: { status: AppointmentStatus.CONFIRMED },
      });

      if (result.count > 0) {
        return this.prisma.bill.findUnique({
          where: { id: updated.id },
          include: BILL_INCLUDE,
        });
      }
    }

    return updated;
  }

  private summarizeSlice(list: any[]) {
    const totalBilled = this.roundCurrency(
      list.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    );
    const totalPaid = this.roundCurrency(
      list.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
    );
    const remainingDue = this.roundCurrency(Math.max(0, totalBilled - totalPaid));
    const paidCount = list.filter((b) => b.status === BillStatus.PAID).length;
    const pendingCount = list.filter((b) => b.status !== BillStatus.PAID && b.status !== BillStatus.CANCELLED).length;

    return {
      totalBilled,
      totalPaid,
      remainingDue,
      count: list.length,
      paidCount,
      pendingCount,
    };
  }

  async getMyBillingSummary(userId: string) {
    const bills = await this.prisma.bill.findMany({
      where: { patient: { userId } },
      include: BILL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const consultationBills = bills.filter(
      (b) => b.billType === BillCategory.CONSULTATION || !b.billType,
    );
    const pharmacyBills = bills.filter((b) => b.billType === BillCategory.PHARMACY);
    const otherBills = bills.filter((b) => b.billType === BillCategory.OTHER);

    const totalBilled = this.roundCurrency(
      bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    );
    const totalPaid = this.roundCurrency(
      bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
    );
    const remainingDue = this.roundCurrency(Math.max(0, totalBilled - totalPaid));

    return {
      totalBilled,
      totalPaid,
      remainingDue,
      invoiceCount: bills.length,
      consultationSummary: this.summarizeSlice(consultationBills),
      pharmacySummary: this.summarizeSlice(pharmacyBills),
      consultationBills,
      pharmacyBills,
      otherBills,
      bills,
    };
  }
}
