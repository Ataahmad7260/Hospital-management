import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { GeneratePharmacyBillDto } from './dto/generate-pharmacy-bill.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Billing & Invoicing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Roles(Role.ADMIN, Role.PHARMACIST)
  @Post()
  @ApiOperation({ summary: 'Admin & Pharmacist: Create hospital billing invoice' })
  async create(@Body() dto: CreateBillDto) {
    return this.billingService.create(dto);
  }

  @Roles(Role.PHARMACIST, Role.ADMIN)
  @Get('pharmacy/prescription/:prescriptionId/preview')
  @ApiOperation({
    summary: 'Pharmacist / Admin: Preview Stage 2 Pharmacy medicine bill pulled from live inventory prices',
  })
  async previewPharmacyBill(@Param('prescriptionId') prescriptionId: string) {
    return this.billingService.previewPharmacyBillForPrescription(prescriptionId);
  }

  @Roles(Role.PHARMACIST, Role.ADMIN)
  @Post('pharmacy/prescription/:prescriptionId')
  @ApiOperation({
    summary: 'Pharmacist / Admin: Generate Stage 2 Pharmacy Medicine Bill using inventory unit prices',
  })
  async generatePharmacyBill(
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: GeneratePharmacyBillDto,
  ) {
    return this.billingService.generatePharmacyBillForPrescription(prescriptionId, dto);
  }

  @Roles(Role.PATIENT)
  @Get('my-summary')
  @ApiOperation({
    summary: 'Patient: Get separated Consultation Fee & Pharmacy Dues billing summary',
  })
  async getMySummary(@CurrentUser() user: any) {
    return this.billingService.getMyBillingSummary(user.id);
  }

  @Roles(Role.ADMIN, Role.PHARMACIST, Role.PATIENT)
  @Get()
  @ApiOperation({
    summary: 'Admin, Pharmacist & Patient: List billing invoices (strictly hidden from Doctor)',
  })
  async findAll(@CurrentUser() user: any) {
    return this.billingService.findAll(user);
  }

  @Roles(Role.ADMIN, Role.PHARMACIST, Role.PATIENT)
  @Patch(':id/pay')
  @ApiOperation({
    summary: 'Admin, Pharmacist & Patient: Record payment (auto-confirms PENDING consultation upon Stage 1 payment)',
  })
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.recordPayment(id, dto.paidAmount, dto.paymentMethod, user);
  }
}
