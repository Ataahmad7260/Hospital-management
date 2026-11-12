import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadMedicalReportDto {
  @ApiPropertyOptional({ example: 'Complete Blood Count (CBC)', description: 'Display title for the report' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'LAB_REPORT',
    description: 'Report category (e.g. LAB_REPORT, IMAGING_XRAY, PRESCRIPTION_SCAN, DISCHARGE_SUMMARY)',
  })
  @IsString()
  @IsOptional()
  reportType?: string;

  @ApiPropertyOptional({
    example: '652f1b2c4f8d2b001a123458',
    description: 'Optional consultation/appointment ObjectId to attach the report directly',
  })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({
    example: '652f1b2c4f8d2b001a123457',
    description: 'Patient profile ObjectId (auto-resolved from session for PATIENT users)',
  })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: 'Fasting sample taken at 8:30 AM', description: 'Optional patient notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

