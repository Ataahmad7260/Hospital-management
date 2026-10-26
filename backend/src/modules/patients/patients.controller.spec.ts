import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';
import { Role } from '../../common/enums/role.enum.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('PatientsController & Service Authorization', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPrismaService = {
    patientProfile: {
      findMany: jest.fn() as any,
      findUnique: jest.fn() as any,
    },
    doctorProfile: {
      findUnique: jest.fn() as any,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
    jest.clearAllMocks();
  });

  describe('GET /patients/me (getMyProfile)', () => {
    it('should return the authenticated patient own profile and records', async () => {
      const mockPatient = {
        id: 'patient-profile-1',
        userId: 'user-patient-1',
        gender: 'FEMALE',
        bloodGroup: 'O_POSITIVE',
        user: { id: 'user-patient-1', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
        appointments: [],
        prescriptions: [],
        medicalRecords: [],
        bills: [],
      };

      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatient);

      const result = await controller.getMyProfile({ id: 'user-patient-1', role: Role.PATIENT });
      expect(result).toEqual(mockPatient);
      expect(mockPrismaService.patientProfile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-patient-1' } }),
      );
    });

    it('should throw NotFoundException if patient profile does not exist', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(null);

      await expect(
        controller.getMyProfile({ id: 'user-unknown', role: Role.PATIENT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('GET /patients (findAll)', () => {
    it('should allow ADMIN to view all registered patients', async () => {
      const allPatients = [
        { id: 'patient-1', user: { firstName: 'Alice' } },
        { id: 'patient-2', user: { firstName: 'Bob' } },
      ];
      mockPrismaService.patientProfile.findMany.mockResolvedValue(allPatients);

      const result = await controller.findAll({ id: 'admin-1', role: Role.ADMIN });
      expect(result).toEqual(allPatients);
      expect(mockPrismaService.patientProfile.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
      });
    });

    it('should filter patient list for DOCTOR to only patients with appointments, prescriptions, or records', async () => {
      const doctorProfile = { id: 'doctor-profile-100', userId: 'doctor-user-1' };
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue(doctorProfile);

      const doctorPatients = [{ id: 'patient-1', user: { firstName: 'Alice' } }];
      mockPrismaService.patientProfile.findMany.mockResolvedValue(doctorPatients);

      const result = await controller.findAll({ id: 'doctor-user-1', role: Role.DOCTOR });
      expect(result).toEqual(doctorPatients);
      expect(mockPrismaService.patientProfile.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { appointments: { some: { doctorId: 'doctor-profile-100' } } },
            { prescriptions: { some: { doctorId: 'doctor-profile-100' } } },
            { medicalRecords: { some: { doctorId: 'doctor-profile-100' } } },
          ],
        },
        include: expect.any(Object),
      });
    });
  });

  describe('GET /patients/:id (findOne)', () => {
    const mockPatientProfile = {
      id: 'patient-profile-1',
      userId: 'user-patient-1',
      user: { id: 'user-patient-1', firstName: 'Jane', lastName: 'Doe' },
      appointments: [{ id: 'apt-1', doctorId: 'doc-profile-1' }],
      prescriptions: [],
      medicalRecords: [],
    };

    it('should allow ADMIN to access any patient profile', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);

      const result = await controller.findOne('patient-profile-1', { id: 'admin-1', role: Role.ADMIN });
      expect(result).toEqual(mockPatientProfile);
    });

    it('should allow PATIENT to view their own profile', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);

      const result = await controller.findOne('patient-profile-1', {
        id: 'user-patient-1',
        role: Role.PATIENT,
      });
      expect(result).toEqual(mockPatientProfile);
    });

    it('should throw ForbiddenException if PATIENT attempts to view another patient record', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);

      await expect(
        controller.findOne('patient-profile-1', { id: 'user-other-patient', role: Role.PATIENT }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow DOCTOR to view a patient they have an appointment/record with', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue({
        id: 'doc-profile-1',
        userId: 'doctor-user-1',
      });

      const result = await controller.findOne('patient-profile-1', {
        id: 'doctor-user-1',
        role: Role.DOCTOR,
      });
      expect(result).toEqual(mockPatientProfile);
    });

    it('should throw ForbiddenException if DOCTOR attempts to view a patient with no clinical relationship', async () => {
      mockPrismaService.patientProfile.findUnique.mockResolvedValue(mockPatientProfile);
      mockPrismaService.doctorProfile.findUnique.mockResolvedValue({
        id: 'doc-profile-999', // Different doctor with no appointments/records
        userId: 'doctor-user-999',
      });

      await expect(
        controller.findOne('patient-profile-1', { id: 'doctor-user-999', role: Role.DOCTOR }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
