import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: '652f1b2c4f8d2b001a123456', description: 'Doctor profile ObjectId' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiProperty({ example: '652f1b2c4f8d2b001a123457', description: 'Patient profile ObjectId' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: '2026-11-15T09:30:00.000Z', description: 'Scheduled date of appointment' })
  @IsDateString()
  @IsNotEmpty()
  appointmentDate: string;

  @ApiProperty({ example: '10:00 - 10:30 AM', description: 'Time slot' })
  @IsString()
  @IsNotEmpty()
  timeSlot: string;

  @ApiPropertyOptional({ example: 'Routine cardiovascular checkup', description: 'Reason for consultation' })
  @IsString()
  @IsOptional()
  reason?: string;
}
