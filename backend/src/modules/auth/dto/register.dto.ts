import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';
import { Gender, BloodGroup } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'patient.john@example.com', description: 'User email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Please provide a valid email address' })
  @Matches(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*$/, {
    message: 'Please provide a valid email address',
  })
  email: string;

  @ApiProperty({ example: 'Pass1234!', description: 'Password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ enum: Role, default: Role.PATIENT, description: 'Role assigned to the user (defaults to PATIENT)' })
  @IsEnum(Role, { message: 'Role must be ADMIN, DOCTOR, PATIENT, or PHARMACIST' })
  @IsOptional()
  role?: Role = Role.PATIENT;

  @ApiPropertyOptional({ example: '+1-555-0199', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Biological gender' })
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: BloodGroup, description: 'Blood group' })
  @IsOptional()
  bloodGroup?: BloodGroup;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}
