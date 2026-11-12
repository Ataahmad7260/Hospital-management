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
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Role } from '../../common/enums/role.enum';
import { BillingService } from '../billing/billing.service';

const APPOINTMENT_INCLUDE = {
  doctor: {
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      department: { select: { name: true, code: true } },
    },
  },
  patient: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
    },
  },
  prescriptions: {
    include: {
      doctor: {
        include: {
          user: { select: { firstName: true, lastName: true } },
          department: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  medicalReports: {
    orderBy: { createdAt: 'desc' as const },
  },
  bills: {
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

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

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${dto.doctorId} not found`);
    }

    const created = await this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        patientId,
        appointmentDate: new Date(dto.appointmentDate),
        timeSlot: dto.timeSlot,
        status: AppointmentStatus.PENDING,
        reason: dto.reason,
      },
    });

    // Stage 1: Generate Consultation Booking Fee bill; settles & confirms immediately if payUpfront=true or fee=0
    await this.billingService.createConsultationBookingBill({
      appointmentId: created.id,
      patientId,
      doctorId: dto.doctorId,
      payUpfront: Boolean(dto.payUpfront),
      paymentMethod: dto.paymentMethod,
    });

    const reloaded = await this.prisma.appointment.findUnique({
      where: { id: created.id },
      include: APPOINTMENT_INCLUDE,
    });

    const [enriched] = await this.enrichAppointments([reloaded || created], user);
    return enriched;
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

    const appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: APPOINTMENT_INCLUDE,
      orderBy: { appointmentDate: 'desc' },
    });

    return this.enrichAppointments(appointments, user);
  }

  async findTodayAppointments(user?: any) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let doctorIdFilter: string | undefined;
    if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      doctorIdFilter = doctorProfile ? doctorProfile.id : '__none__';
    }

    const activeStatuses: AppointmentStatus[] = [
      AppointmentStatus.PENDING,
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.IN_PROGRESS,
      AppointmentStatus.REVIEW,
      AppointmentStatus.FOLLOW_UP,
    ];

    const whereClause: any = {
      ...(doctorIdFilter ? { doctorId: doctorIdFilter } : {}),
      OR: [
        {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        {
          status: { in: activeStatuses },
        },
      ],
    };

    let appointments = await this.prisma.appointment.findMany({
      where: whereClause,
      include: APPOINTMENT_INCLUDE,
      orderBy: { appointmentDate: 'asc' },
    });

    // Fallback to recent consultations for demo DB if today + active queues are both empty
    if (appointments.length === 0) {
      appointments = await this.prisma.appointment.findMany({
        where: doctorIdFilter ? { doctorId: doctorIdFilter } : {},
        include: APPOINTMENT_INCLUDE,
        take: 15,
        orderBy: { appointmentDate: 'desc' },
      });
    }

    return this.enrichAppointments(appointments, user);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    doctorNotes?: string,
    user?: any,
  ) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    await this.assertDoctorOwnership(existing.doctorId, user);

    if (status === AppointmentStatus.COMPLETED) {
      return this.completeConsultation(id, doctorNotes, user);
    }

    // STAGE 1 ENFORCEMENT: Cannot transition PENDING -> CONFIRMED (or active care) while Consultation Fee is unpaid
    if (
      existing.status === AppointmentStatus.PENDING &&
      status !== AppointmentStatus.PENDING &&
      status !== AppointmentStatus.CANCELLED &&
      status !== AppointmentStatus.NO_SHOW
    ) {
      const feeCheck = await this.billingService.isConsultationFeePaid(existing.id);
      if (!feeCheck.paid) {
        throw new BadRequestException(
          `Cannot change consultation status from PENDING to ${status}: Consultation booking fee ($${feeCheck.consultationFee.toFixed(
            2,
          )}) is still PENDING. The patient must settle upfront Consultation Fee in the Patient Portal first.`,
        );
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status,
        ...(doctorNotes !== undefined ? { doctorNotes: doctorNotes.trim() || null } : {}),
      },
      include: APPOINTMENT_INCLUDE,
    });

    const [enriched] = await this.enrichAppointments([updated], user);
    return enriched;
  }

  async completeConsultation(id: string, doctorNotes?: string, user?: any) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    await this.assertDoctorOwnership(existing.doctorId, user);

    if (existing.status === AppointmentStatus.PENDING) {
      const feeCheck = await this.billingService.isConsultationFeePaid(existing.id);
      if (!feeCheck.paid) {
        throw new BadRequestException(
          `Cannot complete consultation while status is PENDING and consultation fee ($${feeCheck.consultationFee.toFixed(
            2,
          )}) is unpaid. Patient must pay consultation fee first.`,
        );
      }
    }

    // Find legacy unlinked prescriptions that belong to this specific consultation
    const legacyMatchedIds = await this.findLegacyPrescriptionIdsForAppointment(existing);

    const prescriptionsToFinalize = await this.prisma.prescription.findMany({
      where: {
        OR: [
          { appointmentId: existing.id },
          ...(legacyMatchedIds.length > 0 ? [{ id: { in: legacyMatchedIds } }] : []),
        ],
      },
    });

    for (const rx of prescriptionsToFinalize) {
      const lockedStatus =
        rx.status === PrescriptionStatus.DISPENSED ||
          rx.status === PrescriptionStatus.PARTIALLY_DISPENSED ||
          rx.status === PrescriptionStatus.CANCELLED
          ? rx.status
          : PrescriptionStatus.ISSUED;

      await this.prisma.prescription.update({
        where: { id: rx.id },
        data: {
          appointmentId: rx.appointmentId || existing.id,
          isFinalized: true,
          status: lockedStatus,
        },
      });
    }

    // In Two-Stage Billing, completing a consultation does NOT auto-create pharmacy bills.
    // Stage 1 (Consultation Fee) was generated at booking; Stage 2 (Pharmacy Bill) is generated by the Pharmacist.
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        ...(doctorNotes !== undefined ? { doctorNotes: doctorNotes.trim() || null } : {}),
      },
      include: APPOINTMENT_INCLUDE,
    });

    const [enriched] = await this.enrichAppointments([updated], user);
    return enriched;
  }

  private async assertDoctorOwnership(appointmentDoctorId: string, user?: any) {
    if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctorProfile || doctorProfile.id !== appointmentDoctorId) {
        throw new ForbiddenException('Access denied: You can only update your own assigned consultations');
      }
    }
  }

  private async findLegacyPrescriptionIdsForAppointment(targetApt: {
    id: string;
    patientId: string;
    doctorId: string;
    createdAt: Date;
  }): Promise<string[]> {
    const [pairAppointments, unlinkedPrescriptions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: targetApt.patientId, doctorId: targetApt.doctorId },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.prescription.findMany({
        where: {
          patientId: targetApt.patientId,
          doctorId: targetApt.doctorId,
          appointmentId: null,
        },
        select: { id: true, createdAt: true },
      }),
    ]);

    const matchedIds: string[] = [];
    for (const rx of unlinkedPrescriptions) {
      const matchedApt = this.resolveTargetAppointmentForLegacyRx(pairAppointments, rx.createdAt);
      if (matchedApt?.id === targetApt.id) {
        matchedIds.push(rx.id);
      }
    }
    return matchedIds;
  }

  private resolveTargetAppointmentForLegacyRx<T extends { id: string; createdAt: Date }>(
    sortedPairAppointments: T[],
    rxCreatedAt: Date,
  ): T | null {
    if (sortedPairAppointments.length === 0) return null;
    let candidate: T | null = null;
    for (const apt of sortedPairAppointments) {
      if (apt.createdAt <= rxCreatedAt) {
        candidate = apt;
      }
    }
    return candidate || sortedPairAppointments[0];
  }

  private async enrichAppointments(appointments: any[], user?: any) {
    if (appointments.length === 0) return appointments;

    const patientIds = Array.from(new Set(appointments.map((a) => a.patientId).filter(Boolean)));
    const doctorIds = Array.from(new Set(appointments.map((a) => a.doctorId).filter(Boolean)));

    const [unlinkedPrescriptions, allPairAppointments, profileReports] = await Promise.all([
      this.prisma.prescription.findMany({
        where: {
          patientId: { in: patientIds },
          doctorId: { in: doctorIds },
          appointmentId: null,
        },
        include: {
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              department: { select: { name: true, code: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.findMany({
        where: {
          patientId: { in: patientIds },
          doctorId: { in: doctorIds },
        },
        select: { id: true, patientId: true, doctorId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.medicalReport.findMany({
        where: {
          patientId: { in: patientIds },
          appointmentId: null,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const pairMap = new Map<string, Array<{ id: string; createdAt: Date }>>();
    for (const apt of allPairAppointments) {
      const key = `${apt.patientId}::${apt.doctorId}`;
      const list = pairMap.get(key) || [];
      list.push({ id: apt.id, createdAt: apt.createdAt });
      pairMap.set(key, list);
    }

    const legacyByAptId = new Map<string, any[]>();
    for (const rx of unlinkedPrescriptions) {
      const key = `${rx.patientId}::${rx.doctorId}`;
      const sortedApts = pairMap.get(key) || [];
      const matchedApt = this.resolveTargetAppointmentForLegacyRx(sortedApts, rx.createdAt);
      if (matchedApt) {
        const list = legacyByAptId.get(matchedApt.id) || [];
        list.push(rx);
        legacyByAptId.set(matchedApt.id, list);
      }
    }

    const profileReportsByPatient = new Map<string, any[]>();
    for (const rep of profileReports) {
      const list = profileReportsByPatient.get(rep.patientId) || [];
      list.push(rep);
      profileReportsByPatient.set(rep.patientId, list);
    }

    const isDoctor = user?.role === Role.DOCTOR;

    return appointments.map((apt) => {
      const directRx = apt.prescriptions || [];
      const legacyRx = legacyByAptId.get(apt.id) || [];
      const mergedRxMap = new Map<string, any>();
      for (const rx of [...directRx, ...legacyRx]) {
        mergedRxMap.set(rx.id, rx);
      }
      const mergedPrescriptions = Array.from(mergedRxMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const allBills: any[] = apt.bills || [];
      const activeConsultBill =
        allBills.find(
          (b) =>
            (b.billType === BillCategory.CONSULTATION || !b.billType) &&
            b.status !== BillStatus.CANCELLED &&
            b.status !== BillStatus.REFUNDED,
        ) || null;
      const pharmacyBills = allBills.filter(
        (b) =>
          b.billType === BillCategory.PHARMACY &&
          b.status !== BillStatus.CANCELLED &&
          b.status !== BillStatus.REFUNDED,
      );

      const consultationFeePaid = activeConsultBill
        ? activeConsultBill.status === BillStatus.PAID
        : apt.status !== AppointmentStatus.PENDING || (apt.doctor?.consultationFee ?? 0) <= 0;

      return {
        ...apt,
        consultationFeePaid,
        bills: isDoctor ? undefined : allBills,
        bill: isDoctor ? undefined : activeConsultBill || allBills[0] || null,
        consultationBill: isDoctor ? undefined : activeConsultBill,
        pharmacyBills: isDoctor ? undefined : pharmacyBills,
        prescriptions: mergedPrescriptions,
        medicalReports: apt.medicalReports || [],
        profileReports: profileReportsByPatient.get(apt.patientId) || [],
      };
    });
  }
}
