import { Module } from '@nestjs/common';
import { PageTrackingService } from './page-tracking.service';
import { PageTrackingController } from './page-tracking.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PageTrackingController],
  providers: [PageTrackingService],
  exports: [PageTrackingService],
})
export class PageTrackingModule {}
