import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class GeneratePharmacyBillItemOverrideDto {
  @ApiPropertyOptional({ example: 'Amoxicillin 500mg', description: 'Prescribed medicine name to match' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiPropertyOptional({ example: 10, description: 'Adjusted quantity to dispense & bill' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  quantity?: number;
}

export class GeneratePharmacyBillDto {
  @ApiPropertyOptional({ example: 0, description: 'Optional dispensing tax percentage (0-30)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(30)
  @IsOptional()
  taxRate?: number = 0;

  @ApiPropertyOptional({ example: 0, description: 'Optional flat discount amount ($)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number = 0;

  @ApiPropertyOptional({
    type: [GeneratePharmacyBillItemOverrideDto],
    description: 'Optional quantity overrides per prescribed medicine (prices still pulled from inventory)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GeneratePharmacyBillItemOverrideDto)
  @IsOptional()
  items?: GeneratePharmacyBillItemOverrideDto[];
}

