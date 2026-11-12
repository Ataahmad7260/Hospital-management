import { PartialType } from '@nestjs/swagger';
import { CreateHospitalStaffDto } from './create-hospital-staff.dto';

export class UpdateHospitalStaffDto extends PartialType(CreateHospitalStaffDto) {}

