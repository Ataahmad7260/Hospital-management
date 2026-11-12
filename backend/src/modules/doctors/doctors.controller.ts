import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
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

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Admin: Add new doctor entry to the hospital roster' })
  @ApiResponse({ status: 201, description: 'Doctor entry created successfully' })
  @ApiResponse({ status: 409, description: 'User with email already exists' })
  async create(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Public/All: List doctors with optional specialty and active status filters' })
  @ApiQuery({ name: 'specialty', required: false, description: 'Filter by specialization or department (case-insensitive)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status (true/false)' })
  async findAll(
    @Query('specialty') specialty?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeFilter = isActive === undefined ? undefined : isActive !== 'false';
    return this.doctorsService.findAll(specialty, activeFilter);
  }

  @Roles(Role.PATIENT, Role.ADMIN, Role.DOCTOR)
  @Get('available-today')
  @ApiOperation({ summary: 'Patient & Admin: List doctors scheduled and available for consultation today' })
  @ApiQuery({ name: 'specialty', required: false, description: 'Filter by specialization (case-insensitive)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status (defaults to true)' })
  async findAvailableToday(
    @Query('specialty') specialty?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeFilter = isActive === undefined ? true : isActive !== 'false';
    return this.doctorsService.findAvailableToday(specialty, activeFilter);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  @Get(':id')
  @ApiOperation({ summary: 'Get doctor details, availability, and recent schedules' })
  async findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}
