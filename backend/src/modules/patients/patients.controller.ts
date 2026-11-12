import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { AdmitPatientDto } from './dto/admit-patient.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Admit New Patient by writing name, condition, assigning doctor, and vitals.
   * Immediately routes case into the Doctor Portal queue.
   */
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Post('admit')
  @ApiOperation({ summary: 'Admit new patient with name & symptoms, route to Doctor consultation queue' })
  @ApiResponse({ status: 201, description: 'Patient admitted successfully' })
  async admitPatient(@Body() dto: AdmitPatientDto, @CurrentUser() user: any) {
    return this.patientsService.admitPatient(dto, user);
  }

  /**
   * Master Patient Overview:
   * Returns all patient entries organized by date, with doctor conducted, medicines prescribed, and money paid.
   */
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Get('overview')
  @ApiOperation({ summary: 'Patient Overview: Get all patient entries sorted by date with doctor, medicines, and billing' })
  async getOverview(@CurrentUser() user: any) {
    return this.patientsService.getOverview(user);
  }

  /**
   * Daily Patient Admissions Statistics:
   * Aggregates admissions by day for the dashboard graph.
   */
  @Public()
  @Get('admissions/daily-stats')
  @ApiOperation({ summary: 'Dashboard: Get daily patient admission counts for graph plotting' })
  async getDailyAdmissionStats() {
    return this.patientsService.getDailyAdmissionStats();
  }

  /**
   * Restricted strictly to authorized administrative and clinical roles.
   * Admin: sees all registered patients in the hospital.
   * Doctor: sees only patients they are authorized to view (assigned consultations/prescriptions/records).
   */
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Get()
  @ApiOperation({ summary: 'Admin & Doctor: List authorized registered patients' })
  async findAll(@CurrentUser() user: any) {
    return this.patientsService.findAll(user);
  }

  /**
   * Secure patient-specific endpoint returning only the authenticated patient's own permitted data.
   */
  @Roles(Role.PATIENT)
  @Get('me')
  @ApiOperation({ summary: 'Patient: Get own medical profile, appointments, prescriptions, and billing' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.patientsService.findMyProfile(user.id);
  }

  /**
   * Get patient medical profile by ID.
   */
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get patient medical profile, history, appointments and records' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.patientsService.findOne(id, user);
  }
}
