import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class DispensePrescriptionDto {
  @ApiPropertyOptional({
    example: '6af29e5f2886a1c6c3a9f087',
    description: 'Optional pharmacist profile or user ObjectId (auto-resolved from session if omitted)',
  })
  @IsString()
  @IsOptional()
  pharmacistId?: string;

  @ApiProperty({
    type: [String],
    example: ['Amoxicillin 500mg', 'Paracetamol 650mg'],
    description: 'Names of medicines handed over / dispensed to the patient',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  itemsDispensed: string[];

  @ApiPropertyOptional({
    example: 'Full prescription handed over after pharmacy bill settlement',
    description: 'Dispensing notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

