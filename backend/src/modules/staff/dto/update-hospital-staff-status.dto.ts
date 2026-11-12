import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HospitalStaffStatus } from '@prisma/client';

export class UpdateHospitalStaffStatusDto {
  @ApiProperty({ enum: HospitalStaffStatus, example: HospitalStaffStatus.ACTIVE })
  @IsEnum(HospitalStaffStatus)
  status: HospitalStaffStatus;
}

