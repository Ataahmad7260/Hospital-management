import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

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
   * Admin: authorized for all patients.
   * Doctor: authorized only for patients they have appointments/records with.
   * Patient: authorized only for their own patient profile.
   */
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get patient medical profile, history, appointments and records' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.patientsService.findOne(id, user);
  }
}
