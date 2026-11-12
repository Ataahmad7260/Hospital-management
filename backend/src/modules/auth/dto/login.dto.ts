import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'doctor.sarah@hospital.com', description: 'User email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Please provide a valid email address' })
  @Matches(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*$/, {
    message: 'Please provide a valid email address',
  })
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'User password (min 6 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
