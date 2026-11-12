import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(Role.DOCTOR, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Doctor only: Issue digital prescription with medications and lab/diagnostic tests' })
  async create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: any) {
    return this.prescriptionsService.create(dto, user);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'List prescriptions scoped by role' })
  async findAll(@CurrentUser() user: any) {
    return this.prescriptionsService.findAll(user);
  }

  @Roles(Role.PHARMACIST)
  @Patch(':id/dispense')
  @ApiOperation({
    summary: 'Pharmacist only: Hand over / dispense medicines (enforces settled Stage 2 Pharmacy Bill)',
  })
  async dispense(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.dispense(id, dto, user);
  }
}
