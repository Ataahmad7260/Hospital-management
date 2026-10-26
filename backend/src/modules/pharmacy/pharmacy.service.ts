import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';

@Injectable()
export class PharmacyService {
  constructor(private readonly prisma: PrismaService) {}

  async createMedicine(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({
      data: {
        name: dto.name,
        genericName: dto.genericName,
        category: dto.category,
        manufacturer: dto.manufacturer,
        batchNumber: dto.batchNumber,
        stockQuantity: dto.stockQuantity,
        reorderLevel: dto.reorderLevel ?? 10,
        unitPrice: dto.unitPrice,
        expiryDate: new Date(dto.expiryDate),
      },
    });
  }

  async findAll() {
    return this.prisma.medicine.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock() {
    return this.prisma.medicine.findMany({
      where: {
        stockQuantity: { lte: 10 },
      },
    });
  }

  async updateStock(id: string, quantityDelta: number) {
    const med = await this.prisma.medicine.findUnique({ where: { id } });
    if (!med) throw new NotFoundException(`Medicine ${id} not found`);

    return this.prisma.medicine.update({
      where: { id },
      data: {
        stockQuantity: Math.max(0, med.stockQuantity + quantityDelta),
      },
    });
  }
}
