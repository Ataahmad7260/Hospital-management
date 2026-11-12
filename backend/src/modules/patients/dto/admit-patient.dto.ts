import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodGroup } from '@prisma/client';

export class AdmitPatientDto {
  @ApiProperty({ description: 'Patient first name', example: 'Arthur' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Patient last name', example: 'Dent' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Patient email address', example: 'arthur.dent@galaxy.org' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Patient contact phone', example: '+1-555-4242' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.OTHER })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: BloodGroup, default: BloodGroup.UNKNOWN })
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1985-05-12' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({ description: 'Assigned Doctor ID who conducts this patient', example: '6adf77ce6db62658693e3199' })
  @IsNotEmpty()
  @IsString()
  doctorId: string;

  @ApiProperty({ description: 'Symptoms / condition / reason for admission', example: 'Severe fever and chest tightness' })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Admission time slot', example: '10:00 - 10:30 AM' })
  @IsOptional()
  @IsString()
  timeSlot?: string;

  @ApiPropertyOptional({ description: 'Admission date', example: '2026-10-28' })
  @IsOptional()
  @IsString()
  appointmentDate?: string;

  @ApiPropertyOptional({ description: 'Blood pressure reading', example: '120/80 mmHg' })
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional({ description: 'Body temperature in °C', example: 38.2 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ description: 'Heart rate in bpm', example: 84 })
  @IsOptional()
  @IsNumber()
  heartRate?: number;

  @ApiPropertyOptional({ description: 'Oxygen saturation SpO2 %', example: 98 })
  @IsOptional()
  @IsNumber()
  oxygenSaturation?: number;

  @ApiPropertyOptional({ description: 'Known allergies list', example: ['Penicillin'] })
  @IsOptional()
  allergies?: string[];
}
