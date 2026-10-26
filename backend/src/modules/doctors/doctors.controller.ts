import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public/All: List all doctors with departments and specializations' })
  async findAll() {
    return this.doctorsService.findAll();
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get doctor details, availability, and recent schedules' })
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}
