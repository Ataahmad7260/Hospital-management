import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PageTrackingService } from './page-tracking.service';
import { PageHitDto } from './dto/page-hit.dto';
import type { Request } from 'express';

@ApiTags('Page Tracking')
@Controller('page-tracking')
export class PageTrackingController {
  constructor(private readonly pageTrackingService: PageTrackingService) {}

  @Post('hit')
  @ApiOperation({ summary: 'Express Page Tracker: Record a client page view or route visit' })
  @ApiResponse({ status: 201, description: 'Page view recorded successfully' })
  async recordHit(@Body() dto: PageHitDto, @Req() req: Request) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Aura-Browser/1.0';
    return this.pageTrackingService.recordHit(dto, {
      ipAddress,
      userAgent,
      method: req.method,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Express Page Tracker: Get aggregated metrics, top visited pages, and recent visit logs' })
  @ApiResponse({ status: 200, description: 'Page tracking analytics and statistics' })
  getStats() {
    return this.pageTrackingService.getStats();
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Express Page Tracker: Reset telemetry log buffer' })
  clearStats() {
    return this.pageTrackingService.clearStats();
  }
}
