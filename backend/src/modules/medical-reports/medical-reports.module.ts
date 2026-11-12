import { Module } from '@nestjs/common';
import { MedicalReportsController } from './medical-reports.controller';
import { MedicalReportsService } from './medical-reports.service';

@Module({
  controllers: [MedicalReportsController],
  providers: [MedicalReportsService],
  exports: [MedicalReportsService],
})
export class MedicalReportsModule {}

