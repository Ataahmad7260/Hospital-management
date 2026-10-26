import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { AppointmentStatus } from '@prisma/client';

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

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'List appointments scoped to user role' })
  async findAll(@CurrentUser() user: any) {
    return this.appointmentsService.findAll(user);
  }

  @Roles(Role.ADMIN, Role.DOCTOR)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Doctor / Admin: Update appointment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }
}
