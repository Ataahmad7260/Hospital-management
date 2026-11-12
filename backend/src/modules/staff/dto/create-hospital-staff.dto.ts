import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import {
  Gender,
  HospitalStaffCategory,
  HospitalStaffStatus,
  StaffShift,
} from '@prisma/client';

const trimToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === ''
    ? undefined
    : typeof value === 'string'
      ? value.trim()
      : value;

export class CreateHospitalStaffDto {
  @ApiPropertyOptional({ example: 'STF-NUR-1024', description: 'Unique hospital employee ID (auto-generated if omitted)' })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiProperty({ example: 'Priya', description: 'Staff member first name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Sharma', description: 'Staff member last name' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    enum: HospitalStaffCategory,
    example: HospitalStaffCategory.NURSE,
    description: 'Hospital staff category (Nurse, Ward Boy, Ward Girl, Lab Technician, etc.)',
  })
  @IsEnum(HospitalStaffCategory)
  category: HospitalStaffCategory;

  @ApiPropertyOptional({
    example: 'ICU Staff Nurse',
    description: 'Specific role title or custom designation (defaults from category if omitted)',
  })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.FEMALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '+1-555-0142', description: 'Primary contact phone number' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'priya.nurse@hospital.com', description: 'Optional contact email address' })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : typeof value === 'string'
        ? value.trim().toLowerCase()
        : value,
  )
  @IsString()
  @Matches(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*$/, {
    message: 'Please provide a valid email address',
  })
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'ICU / Critical Care', description: 'Assigned hospital department or wing' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiPropertyOptional({ example: 'Ward B - Floor 2', description: 'Assigned ward, floor, or station' })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  assignedWard?: string;

  @ApiPropertyOptional({ enum: StaffShift, example: StaffShift.MORNING })
  @IsEnum(StaffShift)
  @IsOptional()
  shift?: StaffShift;

  @ApiPropertyOptional({ example: 'B.Sc Nursing / GNM', description: 'Qualifications or certifications' })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional({ example: 2400, description: 'Monthly salary / compensation' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlySalary?: number;

  @ApiPropertyOptional({ example: '+1-555-0199', description: 'Emergency contact name or phone' })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Joining date (ISO date)' })
  @Transform(trimToUndefined)
  @IsDateString()
  @IsOptional()
  joiningDate?: string;

  @ApiPropertyOptional({ enum: HospitalStaffStatus, example: HospitalStaffStatus.ACTIVE })
  @IsEnum(HospitalStaffStatus)
  @IsOptional()
  status?: HospitalStaffStatus;

  @ApiPropertyOptional({ example: 'Trained for cardiac ICU monitoring', description: 'Administrative notes' })
  @Transform(trimToUndefined)
  @IsString()
  @IsOptional()
  notes?: string;
}

