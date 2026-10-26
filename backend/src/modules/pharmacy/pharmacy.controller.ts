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

  @Roles(Role.ADMIN, Role.PHARMACIST)
  @Post('medicines')
  @ApiOperation({ summary: 'Pharmacist/Admin: Add new medicine to inventory' })
  async createMedicine(@Body() dto: CreateMedicineDto) {
    return this.pharmacyService.createMedicine(dto);
  }

  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST)
  @Get('medicines')
  @ApiOperation({ summary: 'List all medicines and inventory stocks' })
  async findAll() {
    return this.pharmacyService.findAll();
  }

  @Roles(Role.ADMIN, Role.PHARMACIST)
  @Get('medicines/low-stock')
  @ApiOperation({ summary: 'Pharmacist/Admin: Check low stock alerts' })
  async findLowStock() {
    return this.pharmacyService.findLowStock();
  }

  @Roles(Role.ADMIN, Role.PHARMACIST)
  @Patch('medicines/:id/stock')
  @ApiOperation({ summary: 'Adjust medicine stock quantity' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantityDelta') quantityDelta: number,
  ) {
    return this.pharmacyService.updateStock(id, quantityDelta);
  }
}
