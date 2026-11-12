import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: AppointmentStatus,
    example: AppointmentStatus.REVIEW,
    description: 'Updated consultation status (including REVIEW and FOLLOW_UP)',
  })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({
    example: 'Awaiting CBC and blood sugar lab results; review scheduled in 1 hour.',
    description: 'Optional doctor notes or follow-up instructions visible to patient',
  })
  @IsString()
  @IsOptional()
  doctorNotes?: string;
}

export class CompleteConsultationDto {
  @ApiPropertyOptional({
    example: 'Consultation concluded. Final prescription issued to patient.',
    description: 'Optional closing summary remarks from physician',
  })
  @IsString()
  @IsOptional()
  doctorNotes?: string;
}

