import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';
import { AppointmentStatus, Gender, BloodGroup, Role as PrismaRole } from '@prisma/client';
import { AdmitPatientDto } from './dto/admit-patient.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Admin / Staff / Patient Admission:
   * Write patient name, enter condition, and admit immediately to a doctor.
   */
  async admitPatient(dto: AdmitPatientDto, currentUser?: any) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException(`Attending doctor with ID ${dto.doctorId} not found`);
    }

    // Determine or generate user email
    const safeFirst = dto.firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeLast = dto.lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = (
      dto.email?.trim() ||
      `${safeFirst}.${safeLast}.${Date.now().toString().slice(-4)}@aura.hospital`
    ).toLowerCase();

    // Find or create the user and patient profile
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true },
    });

    let patientProfile = user?.patientProfile;

    if (!user) {
      const passwordHash = await bcrypt.hash('Hospital123!', 10);
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phoneNumber: dto.phoneNumber?.trim() || null,
          role: PrismaRole.PATIENT,
          patientProfile: {
            create: {
              gender: dto.gender || Gender.OTHER,
              bloodGroup: dto.bloodGroup || BloodGroup.UNKNOWN,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
              allergies: dto.allergies || [],
            },
          },
        },
        include: { patientProfile: true },
      });
      patientProfile = user.patientProfile;
    } else if (!patientProfile) {
      patientProfile = await this.prisma.patientProfile.create({
        data: {
          userId: user.id,
          gender: dto.gender || Gender.OTHER,
          bloodGroup: dto.bloodGroup || BloodGroup.UNKNOWN,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          allergies: dto.allergies || [],
        },
      });
    }

    if (!patientProfile) {
      throw new NotFoundException('Failed to establish patient clinical profile');
    }

    // Create consultation / admission appointment
    const appointmentDate = dto.appointmentDate ? new Date(dto.appointmentDate) : new Date();
    const timeSlot =
      dto.timeSlot ||
      `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Priority Admission`;

    const appointment = await this.prisma.appointment.create({
      data: {
        doctorId: doctor.id,
        patientId: patientProfile.id,
        appointmentDate,
        timeSlot,
        status: AppointmentStatus.IN_PROGRESS,
        reason: dto.reason.trim(),
      },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true } },
          },
        },
      },
    });

    // Create medical record with vitals if provided or symptoms
    try {
      await this.prisma.medicalRecord.create({
        data: {
          patientId: patientProfile.id,
          doctorId: doctor.id,
          appointmentId: appointment.id,
          diagnosis: 'Under Clinical Examination',
          symptoms: [dto.reason.trim()],
          clinicalNotes: `Admitted: ${dto.reason.trim()}`,
          vitals: {
            bloodPressure: dto.bloodPressure || null,
            temperature: dto.temperature ?? null,
            heartRate: dto.heartRate ?? null,
            oxygenSaturation: dto.oxygenSaturation ?? null,
            recordedAt: new Date(),
          },
        },
      });
    } catch {
      // Non-fatal
    }

    return {
      message: 'Patient admitted successfully and routed to doctor consultation queue',
      admission: appointment,
    };
  }

  /**
   * Master Patient Overview:
   * Aggregates all patient entries ordered by date, containing:
   * - Admission date
   * - Patient info
   * - Attending doctor who conducted the patient
   * - Doctor diagnosis & prescribed medicines
   * - Dispensary fulfillment
   * - How much money the patient paid & invoice status
   */
  async getOverview(user?: any) {
    let patientFilter = {};
    if (user?.role === Role.PATIENT) {
      const myProfile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      patientFilter = { patientId: myProfile?.id || '__none__' };
    }

    const appointments = await this.prisma.appointment.findMany({
      where: patientFilter,
      include: {
        patient: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true } },
            bills: { orderBy: { createdAt: 'desc' } },
            prescriptions: {
              include: {
                dispensedLogs: true,
                doctor: {
                  include: { user: { select: { firstName: true, lastName: true } } },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        doctor: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            department: true,
          },
        },
        medicalRecord: true,
        bill: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return appointments.map((apt) => {
      // Find bills associated with this appointment or patient
      const bill = apt.bill || apt.patient.bills[0] || null;
      // Find prescriptions conducted by this doctor for this patient
      const prescriptions = apt.patient.prescriptions.filter(
        (rx) => rx.doctorId === apt.doctorId,
      );

      return {
        id: apt.id,
        admissionDate: apt.appointmentDate,
        timeSlot: apt.timeSlot,
        status: apt.status,
        reason: apt.reason,
        patient: {
          id: apt.patient.id,
          firstName: apt.patient.user.firstName,
          lastName: apt.patient.user.lastName,
          email: apt.patient.user.email,
          phoneNumber: apt.patient.user.phoneNumber,
          gender: apt.patient.gender,
          bloodGroup: apt.patient.bloodGroup,
        },
        attendingDoctor: {
          id: apt.doctor.id,
          firstName: apt.doctor.user.firstName,
          lastName: apt.doctor.user.lastName,
          specialization: apt.doctor.specialization,
          department: apt.doctor.department?.name || 'General Medicine',
          consultationFee: apt.doctor.consultationFee,
        },
        medicalRecord: apt.medicalRecord
          ? {
              diagnosis: apt.medicalRecord.diagnosis,
              symptoms: apt.medicalRecord.symptoms,
              clinicalNotes: apt.medicalRecord.clinicalNotes,
              vitals: apt.medicalRecord.vitals,
            }
          : null,
        prescriptions: prescriptions.map((rx) => ({
          id: rx.id,
          prescriptionNo: rx.prescriptionNo,
          status: rx.status,
          doctorNotes: rx.doctorNotes,
          createdAt: rx.createdAt,
          items: rx.items,
          dispensedLogs: rx.dispensedLogs,
        })),
        billing: bill
          ? {
              id: bill.id,
              invoiceNumber: bill.invoiceNumber,
              totalAmount: bill.totalAmount,
              paidAmount: bill.paidAmount,
              subtotal: bill.subtotal,
              taxAmount: bill.taxAmount,
              status: bill.status,
              paymentMethod: bill.paymentMethod,
              paidAt: bill.paidAt,
              items: bill.items,
            }
          : null,
      };
    });
  }

  /**
   * Daily Patient Admissions Statistics:
   * Aggregates admissions by day for interactive graph visualization.
   */
  async getDailyAdmissionStats() {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { lastName: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    const dailyMap: Record<
      string,
      { date: string; formattedDate: string; count: number; patients: string[] }
    > = {};

    // Seed last 14 days so the graph has a continuous baseline even if no admissions on some days
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap[iso] = {
        date: iso,
        formattedDate: formatted,
        count: 0,
        patients: [],
      };
    }

    for (const apt of appointments) {
      const iso = new Date(apt.appointmentDate).toISOString().split('T')[0];
      const patientName = `${apt.patient.user.firstName} ${apt.patient.user.lastName}`;
      if (!dailyMap[iso]) {
        const d = new Date(apt.appointmentDate);
        dailyMap[iso] = {
          date: iso,
          formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: 0,
          patients: [],
        };
      }
      dailyMap[iso].count += 1;
      dailyMap[iso].patients.push(patientName);
    }

    const data = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const totalAdmissions = appointments.length;
    const todayIso = today.toISOString().split('T')[0];
    const todayCount = dailyMap[todayIso]?.count || 0;
    const peakDay = [...data].sort((a, b) => b.count - a.count)[0] || {
      date: todayIso,
      count: 0,
      formattedDate: 'None',
    };

    return {
      dailyData: data,
      summary: {
        totalAdmissions,
        todayCount,
        averageDaily:
          data.length > 0 ? (totalAdmissions / data.length).toFixed(1) : '0.0',
        peakDay: {
          date: peakDay.date,
          formattedDate: peakDay.formattedDate,
          count: peakDay.count,
        },
      },
    };
  }

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
