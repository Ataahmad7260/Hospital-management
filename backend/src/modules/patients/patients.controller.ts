import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Roles(Role.ADMIN, Role.DOCTOR)
  @Get()
  @ApiOperation({ summary: 'Admin & Doctor: List registered patients' })
  async findAll() {
    return this.patientsService.findAll();
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get patient medical profile, history, appointments and records' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }
}
