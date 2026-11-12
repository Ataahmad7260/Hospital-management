import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HospitalStaffCategory, HospitalStaffStatus, StaffShift } from '@prisma/client';
import { StaffService } from './staff.service';
import { CreateHospitalStaffDto } from './dto/create-hospital-staff.dto';
import { UpdateHospitalStaffDto } from './dto/update-hospital-staff.dto';
import { UpdateHospitalStaffStatusDto } from './dto/update-hospital-staff-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Hospital Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiOperation({
    summary:
      'Admin only: Add hospital staff member (Nurse, Head Nurse, Ward Boy, Ward Girl, Lab Technician, Receptionist, Housekeeping, Security, etc.)',
  })
  async create(@Body() dto: CreateHospitalStaffDto) {
    return this.staffService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Admin only: List all hospital staff with optional category, shift, status, and search filters',
  })
  @ApiQuery({ name: 'category', enum: HospitalStaffCategory, required: false })
  @ApiQuery({ name: 'status', enum: HospitalStaffStatus, required: false })
  @ApiQuery({ name: 'shift', enum: StaffShift, required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('category') category?: HospitalStaffCategory,
    @Query('status') status?: HospitalStaffStatus,
    @Query('shift') shift?: StaffShift,
    @Query('search') search?: string,
  ) {
    return this.staffService.findAll({ category, status, shift, search });
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Admin only: Get hospital workforce counts across Nurses, Ward Boys, Ward Girls, Technicians & Support',
  })
  async getStats() {
    return this.staffService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin only: Get hospital staff profile by ID' })
  async findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin only: Update hospital staff details, role category, ward, shift, or salary' })
  async update(@Param('id') id: string, @Body() dto: UpdateHospitalStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin only: Update hospital staff duty status (ACTIVE, ON_LEAVE, INACTIVE)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHospitalStaffStatusDto,
  ) {
    return this.staffService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin only: Remove hospital staff member record' })
  async remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}

