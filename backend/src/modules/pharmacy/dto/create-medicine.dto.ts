import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMedicineDto {
  @ApiProperty({ example: 'Paracetamol 650mg', description: 'Medicine commercial name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Acetaminophen', description: 'Generic pharmacological name' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiProperty({ example: 'Tablet', description: 'Form factor (Tablet, Syrup, Injection, etc.)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'GSK Pharmaceuticals', description: 'Manufacturer company' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiProperty({ example: 'BATCH-2026-X89', description: 'Batch tracking code' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: 500, description: 'Available stock units' })
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiPropertyOptional({ example: 25, description: 'Low stock reorder alert threshold' })
  @IsInt()
  @IsOptional()
  @Min(1)
  reorderLevel?: number = 10;

  @ApiProperty({ example: 3.5, description: 'Unit price in standard currency' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: '2027-12-31T00:00:00.000Z', description: 'Expiration date' })
  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;
}
