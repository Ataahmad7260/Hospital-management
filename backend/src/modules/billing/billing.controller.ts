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

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Admin: Create billing invoice' })
  async create(@Body() dto: CreateBillDto) {
    return this.billingService.create(dto);
  }

  @Roles(Role.ADMIN, Role.PATIENT)
  @Get()
  @ApiOperation({ summary: 'Admin & Patient: List billing invoices' })
  async findAll(@CurrentUser() user: any) {
    return this.billingService.findAll(user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Admin: Record payment against an invoice' })
  async recordPayment(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount: number,
  ) {
    return this.billingService.recordPayment(id, paidAmount);
  }
}
