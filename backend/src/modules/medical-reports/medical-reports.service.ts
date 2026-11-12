import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

export interface UploadedReportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MedicalReportsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads', 'medical-reports');

  constructor(private readonly prisma: PrismaService) {
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  async uploadReport(
    file: UploadedReportFile,
    metadata: {
      title?: string;
      reportType?: string;
      appointmentId?: string;
      patientId?: string;
      notes?: string;
    },
    user: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Please select a PDF or image file to upload');
    }

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('Only PDF, PNG, JPG, or WEBP medical report files are allowed');
    }

    let patientId = metadata.patientId?.trim();
    if (user?.role === Role.PATIENT) {
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!patientProfile) {
        throw new NotFoundException('Patient clinical profile not found');
      }
      patientId = patientProfile.id;
    }

    if (!patientId) {
      throw new BadRequestException('Patient ID is required for uploading a report');
    }

    const appointmentId = metadata.appointmentId?.trim() || undefined;
    if (appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!appointment) {
        throw new NotFoundException(`Consultation ${appointmentId} not found`);
      }
      if (appointment.patientId !== patientId) {
        throw new ForbiddenException('You can only attach reports to your own consultation');
      }
    }

    const rawBaseName = path.basename(file.originalname || 'report');
    const safeOrigName = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = path.extname(safeOrigName) || (file.mimetype === 'application/pdf' ? '.pdf' : '.png');
    const storedName = `${Date.now()}-${randomUUID()}${ext}`;
    const fullPath = path.join(this.uploadDir, storedName);

    fs.mkdirSync(this.uploadDir, { recursive: true });
    await fs.promises.writeFile(fullPath, file.buffer);

    const defaultTitle = rawBaseName.replace(/\.[^/.]+$/, '') || 'Medical Report';

    return this.prisma.medicalReport.create({
      data: {
        patientId,
        appointmentId: appointmentId || null,
        title: metadata.title?.trim() || defaultTitle,
        reportType: metadata.reportType?.trim() || 'LAB_REPORT',
        fileName: safeOrigName,
        storedName,
        mimeType: file.mimetype,
        fileSize: file.size,
        notes: metadata.notes?.trim() || null,
        uploadedById: user.id,
      },
      include: {
        appointment: {
          select: { id: true, appointmentDate: true, timeSlot: true, status: true },
        },
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }

  async findAll(user: any, filters?: { appointmentId?: string; patientId?: string }) {
    const where: any = {};

    if (filters?.appointmentId?.trim()) {
      where.appointmentId = filters.appointmentId.trim();
    }

    if (user?.role === Role.PATIENT) {
      const myProfile = await this.prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      where.patientId = myProfile ? myProfile.id : '__none__';
    } else if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctorProfile) {
        return [];
      }
      if (filters?.patientId?.trim()) {
        where.patientId = filters.patientId.trim();
      }
      where.patient = {
        OR: [
          { appointments: { some: { doctorId: doctorProfile.id } } },
          { prescriptions: { some: { doctorId: doctorProfile.id } } },
        ],
      };
    } else if (filters?.patientId?.trim()) {
      where.patientId = filters.patientId.trim();
    }

    return this.prisma.medicalReport.findMany({
      where,
      include: {
        appointment: {
          select: { id: true, appointmentDate: true, timeSlot: true, status: true },
        },
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReportFile(reportId: string, user: any): Promise<StreamableFile> {
    const report = await this.findAuthorizedReport(reportId, user);
    const filePath = path.join(this.uploadDir, path.basename(report.storedName));

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Stored medical report file could not be found on server');
    }

    const stream = fs.createReadStream(filePath);
    const safeDownloadName = report.fileName.replace(/"/g, '');
    return new StreamableFile(stream, {
      type: report.mimeType,
      disposition: `inline; filename="${safeDownloadName}"`,
    });
  }

  async removeReport(reportId: string, user: any) {
    const report = await this.findAuthorizedReport(reportId, user);
    if (user?.role === Role.PATIENT && report.uploadedById !== user.id) {
      throw new ForbiddenException('Access denied: You can only remove your own uploaded reports');
    }

    const filePath = path.join(this.uploadDir, path.basename(report.storedName));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => null);
    }

    await this.prisma.medicalReport.delete({ where: { id: reportId } });
    return { deleted: true, id: reportId };
  }

  private async findAuthorizedReport(reportId: string, user: any) {
    const report = await this.prisma.medicalReport.findUnique({
      where: { id: reportId },
      include: {
        patient: {
          include: {
            appointments: { select: { doctorId: true } },
            prescriptions: { select: { doctorId: true } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Medical report ${reportId} not found`);
    }

    if (user?.role === Role.PATIENT) {
      if (report.patient.userId !== user.id) {
        throw new ForbiddenException('Access denied: Report belongs to another patient');
      }
    } else if (user?.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      const isAssigned =
        doctorProfile &&
        (report.patient.appointments.some((a) => a.doctorId === doctorProfile.id) ||
          report.patient.prescriptions.some((p) => p.doctorId === doctorProfile.id));

      if (!isAssigned) {
        throw new ForbiddenException('Access denied: You are not assigned to this patient case');
      }
    }

    return report;
  }
}

