import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateBillDto } from './dto/create-bill.dto';
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

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'Admin, Doctor, Pharmacist & Patient: List billing invoices' })
  async findAll(@CurrentUser() user: any) {
    return this.billingService.findAll(user);
  }

  @Roles(Role.ADMIN, Role.PHARMACIST, Role.PATIENT)
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Admin, Pharmacist & Patient: Record payment against an invoice' })
  async recordPayment(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount: number,
    @Body('paymentMethod') paymentMethod?: any,
  ) {
    return this.billingService.recordPayment(id, paidAmount, paymentMethod);
  }
}

