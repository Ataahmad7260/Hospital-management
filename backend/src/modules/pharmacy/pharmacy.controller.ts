import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PharmacyService } from './pharmacy.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Pharmacy & Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Roles(Role.PHARMACIST)
  @Post('medicines')
  @ApiOperation({ summary: 'Pharmacist only: Add new medicine to inventory' })
  async createMedicine(@Body() dto: CreateMedicineDto) {
    return this.pharmacyService.createMedicine(dto);
  }

  @Roles(Role.PHARMACIST, Role.DOCTOR)
  @Get('medicines')
  @ApiOperation({ summary: 'Pharmacist & Doctor: List all medicines and inventory stocks' })
  async findAll() {
    return this.pharmacyService.findAll();
  }

  @Roles(Role.PHARMACIST)
  @Get('medicines/low-stock')
  @ApiOperation({ summary: 'Pharmacist only: Check low stock alerts' })
  async findLowStock() {
    return this.pharmacyService.findLowStock();
  }

  @Roles(Role.PHARMACIST)
  @Patch('medicines/:id/stock')
  @ApiOperation({ summary: 'Pharmacist only: Adjust medicine stock quantity' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantityDelta') quantityDelta: number,
  ) {
    return this.pharmacyService.updateStock(id, quantityDelta);
  }

  @Roles(Role.PHARMACIST)
  @Get('sales-ledger')
  @ApiOperation({
    summary:
      'Pharmacist only: Comprehensive Sales & Revenue Ledger with medicine breakdown, itemized payments, last 30 days & overall totals',
  })
  async getSalesLedger() {
    return this.pharmacyService.getSalesLedger();
  }
}
