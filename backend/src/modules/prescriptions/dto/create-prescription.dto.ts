import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin', description: 'Medicine brand or generic name' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ example: '500mg', description: 'Dosage amount' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: '1-0-1 (twice daily)', description: 'Dosage frequency' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: 7, description: 'Duration in days' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({ example: 'Take after meals with water', description: 'Special instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class LabTestItemDto {
  @ApiProperty({ example: 'CBC (Complete Blood Count)', description: 'Lab or diagnostic test name' })
  @IsString()
  @IsNotEmpty()
  testName: string;

  @ApiPropertyOptional({ example: 'Routine', description: 'Test priority/urgency (Routine, Urgent, STAT)' })
  @IsString()
  @IsOptional()
  urgency?: string;

  @ApiPropertyOptional({ example: 'Fasting 8 hours prior to sample collection', description: 'Sample or prep instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: '652f1b2c4f8d2b001a123457', description: 'Patient profile ObjectId' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ example: '652f1b2c4f8d2b001a123456', description: 'Doctor profile ObjectId (auto-resolved from session if omitted)' })
  @IsString()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional({ example: '652f1b2c4f8d2b001a123458', description: 'Related medical record ObjectId' })
  @IsString()
  @IsOptional()
  medicalRecordId?: string;

  @ApiPropertyOptional({
    example: '652f1b2c4f8d2b001a123459',
    description: 'Consultation/Appointment ObjectId to link this prescription directly to the visit',
  })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'Patient advised to complete full antibiotic course', description: 'Doctor remarks' })
  @IsString()
  @IsOptional()
  doctorNotes?: string;

  @ApiPropertyOptional({ type: [PrescriptionItemDto], description: 'List of prescribed medications' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];

  @ApiPropertyOptional({ type: [LabTestItemDto], description: 'List of ordered lab or diagnostic tests' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LabTestItemDto)
  labTests?: LabTestItemDto[];
}
