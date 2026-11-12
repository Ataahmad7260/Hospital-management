import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'David', description: 'Doctor first name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Miller', description: 'Doctor last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'doctor.david@hospital.com', description: 'Doctor login email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Please provide a valid email address' })
  @Matches(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*$/, {
    message: 'Please provide a valid email address',
  })
  email: string;

  @ApiPropertyOptional({ example: 'Hospital123!', description: 'Doctor initial password' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '+1-555-0188', description: 'Contact phone' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'Neurology Specialist', description: 'Medical specialization' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiPropertyOptional({ example: 'MD-NEURO-8821', description: 'Medical license number' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: ['MBBS', 'MD Neurology'], description: 'Academic & medical credentials' })
  @IsArray()
  @IsOptional()
  qualifications?: string[];

  @ApiPropertyOptional({ example: 85.0, description: 'Consultation fee in standard currency' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Suite 404', description: 'Clinic office/room number' })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Neurology', description: 'Department Name' })
  @IsString()
  @IsOptional()
  departmentName?: string;

  @ApiPropertyOptional({ example: '6adf77ce6db62658693e3191', description: 'Department ObjectId' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ example: ['Monday', 'Tuesday', 'Wednesday'], description: 'Available clinic days' })
  @IsArray()
  @IsOptional()
  availableDays?: string[];
}
