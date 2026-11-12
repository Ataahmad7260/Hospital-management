import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CompleteConsultationDto, UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(Role.ADMIN, Role.PATIENT)
  @Post()
  @ApiOperation({ summary: 'Book an appointment with a doctor' })
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(dto, user);
  }

  @Roles(Role.DOCTOR, Role.ADMIN)
  @Get('today')
  @ApiOperation({ summary: 'Doctor only: Real-time queue including active review and follow-up cases' })
  async findToday(@CurrentUser() user: any) {
    return this.appointmentsService.findTodayAppointments(user);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'List appointments scoped to user role with linked prescriptions & reports' })
  async findAll(@CurrentUser() user: any) {
    return this.appointmentsService.findAll(user);
  }

  @Roles(Role.ADMIN, Role.DOCTOR)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Doctor / Admin: Update consultation status (including REVIEW and FOLLOW_UP)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, dto.status, dto.doctorNotes, user);
  }

  @Roles(Role.ADMIN, Role.DOCTOR)
  @Patch(':id/complete')
  @ApiOperation({ summary: 'Doctor / Admin: Complete consultation, close case, and finalize linked prescriptions' })
  async completeConsultation(
    @Param('id') id: string,
    @Body() dto: CompleteConsultationDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.completeConsultation(id, dto?.doctorNotes, user);
  }
}
