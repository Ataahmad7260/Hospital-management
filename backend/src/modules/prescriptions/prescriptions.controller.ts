import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Roles(Role.DOCTOR)
  @Post()
  @ApiOperation({ summary: 'Doctor only: Issue digital prescription with medications' })
  async create(@Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(dto);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'List prescriptions' })
  async findAll() {
    return this.prescriptionsService.findAll();
  }

  @Roles(Role.PHARMACIST)
  @Patch(':id/dispense')
  @ApiOperation({ summary: 'Pharmacist only: Dispense medicines and update fulfillment status' })
  async dispense(
    @Param('id') id: string,
    @Body('pharmacistId') pharmacistId: string,
    @Body('itemsDispensed') itemsDispensed: string[],
    @Body('notes') notes?: string,
  ) {
    return this.prescriptionsService.dispense(id, pharmacistId, itemsDispensed, notes);
  }
}
