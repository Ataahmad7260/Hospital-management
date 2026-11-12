import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PageHitDto } from './dto/page-hit.dto';

export interface PageViewRecord {
  id: string;
  pageUrl: string;
  pageTitle: string;
  userRole: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  method: string;
  timestamp: Date;
}

@Injectable()
export class PageTrackingService {
  private readonly logger = new Logger('PageTrackingService');
  private readonly pageViews: PageViewRecord[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async recordHit(dto: PageHitDto, meta: { ipAddress?: string; userAgent?: string; method?: string }) {
    const record: PageViewRecord = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageUrl: dto.pageUrl,
      pageTitle: dto.pageTitle || this.inferTitle(dto.pageUrl),
      userRole: dto.userRole || 'GUEST',
      userId: dto.userId,
      ipAddress: meta.ipAddress || '127.0.0.1',
      userAgent: meta.userAgent || 'Aura-Client/1.0',
      referrer: dto.referrer,
      method: meta.method || 'GET',
      timestamp: new Date(),
    };

    this.pageViews.unshift(record);
    if (this.pageViews.length > this.MAX_HISTORY) {
      this.pageViews.pop();
    }

    // Optionally record to audit log
    try {
      if (dto.userId) {
        await this.prisma.auditLog.create({
          data: {
            userId: dto.userId,
            action: 'PAGE_VIEW',
            resource: 'PageTracking',
            resourceId: dto.pageUrl,
            details: JSON.stringify({ pageTitle: record.pageTitle, role: record.userRole }),
            ipAddress: record.ipAddress,
          },
        });
      }
    } catch {
      // Non-blocking telemetry
    }

    return { success: true, recordedAt: record.timestamp, pageUrl: record.pageUrl };
  }

  getStats() {
    const totalViews = this.pageViews.length;
    const viewsByPage: Record<string, number> = {};
    const viewsByRole: Record<string, number> = {};
    const viewsByDay: Record<string, number> = {};

    for (const view of this.pageViews) {
      // By Page
      viewsByPage[view.pageUrl] = (viewsByPage[view.pageUrl] || 0) + 1;
      // By Role
      viewsByRole[view.userRole] = (viewsByRole[view.userRole] || 0) + 1;
      // By Day
      const dayKey = view.timestamp.toISOString().split('T')[0];
      viewsByDay[dayKey] = (viewsByDay[dayKey] || 0) + 1;
    }

    const uniquePages = Object.keys(viewsByPage).length;

    // Top pages sorted by hits
    const topPages = Object.entries(viewsByPage)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViews,
      uniquePages,
      viewsByPage,
      viewsByRole,
      viewsByDay,
      topPages,
      recentViews: this.pageViews.slice(0, 50),
      timestamp: new Date(),
    };
  }

  clearStats() {
    this.pageViews.length = 0;
    return { success: true, message: 'Telemetry stats cleared' };
  }

  private inferTitle(url: string): string {
    const clean = url.replace(/^\//, '').split('?')[0];
    if (!clean) return 'Hospital Dashboard';
    return clean
      .split('/')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' / ');
  }
}
