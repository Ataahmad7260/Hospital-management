import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { PageTrackingService } from './page-tracking.service';

@Injectable()
export class PageTrackingMiddleware implements NestMiddleware {
  constructor(private readonly pageTrackingService: PageTrackingService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Only track GET navigation / API queries to avoid spamming telemetry
    if (req.method === 'GET' && !req.originalUrl.includes('/page-tracking/stats') && !req.originalUrl.includes('/favicon.ico')) {
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Express-Internal/1.0';
      const userRole = (req as any).user?.role || 'SYSTEM';
      const userId = (req as any).user?.id;

      this.pageTrackingService.recordHit(
        {
          pageUrl: req.originalUrl,
          pageTitle: `Express: ${req.originalUrl}`,
          userRole,
          userId,
        },
        {
          ipAddress,
          userAgent,
          method: req.method,
        },
      );
    }
    next();
  }
}
