import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'patient.john@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
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

  @ApiProperty({ enum: Role, default: Role.PATIENT, description: 'Role assigned to the user' })
  @IsEnum(Role, { message: 'Role must be ADMIN, DOCTOR, PATIENT, or PHARMACIST' })
  @IsOptional()
  role?: Role = Role.PATIENT;

  @ApiPropertyOptional({ example: '+1-555-0199', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
