import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Activity,
} from 'lucide-react';
import type { DailyAdmissionsStats } from '../../../shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  stats: DailyAdmissionsStats | null;
  loading?: boolean;
  onAdmitPatientClick?: () => void;
  onSelectDay?: (date: string) => void;
}

export const DailyPatientAdmissionsGraph: React.FC<Props> = ({
  stats,
  loading = false,
  onAdmitPatientClick,
  onSelectDay,
}) => {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    formattedDate: string;
    count: number;
    patients: string[];
  } | null>(null);

  const [timeFilter, setTimeFilter] = useState<'7' | '14' | 'all'>('14');

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-secondary rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-secondary/50 rounded-lg"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
        <Activity size={24} className="mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm font-semibold text-foreground">Daily Admissions Analytics</div>
        <div className="text-xs text-muted-foreground mt-1">No admission stats available yet.</div>
      </div>
    );
  }

  const allData = stats.dailyData || [];
  const filteredData =
    timeFilter === '7'
      ? allData.slice(-7)
      : timeFilter === '14'
      ? allData.slice(-14)
      : allData;

  const maxCount = Math.max(...filteredData.map((d) => d.count), 4);
  const totalInView = filteredData.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6 w-full max-w-full min-w-0 overflow-hidden">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                Daily Patient Admissions Graph
                <span className="text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Live Analytics
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track how many new patients are admitted day-by-day across all hospital clinical departments
              </p>
            </div>
          </div>
        </div>

        {/* Time filters & Action */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 rounded-lg bg-secondary border border-border text-xs font-mono">
            <button
              onClick={() => setTimeFilter('7')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors cursor-pointer',
                timeFilter === '7'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeFilter('14')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors cursor-pointer',
                timeFilter === '14'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors cursor-pointer',
                timeFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Time
            </button>
          </div>

          {onAdmitPatientClick && (
            <Button
              size="sm"
              onClick={onAdmitPatientClick}
              className="cursor-pointer gap-1.5"
            >
              <span>+ Admit Patient</span>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-secondary/40 border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-mono flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <Activity size={12} />
            </div>
            <span>Today's Admissions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats.summary.todayCount}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Admitted since 12:00 AM</div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-mono flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <Users size={12} />
            </div>
            <span>Range Admissions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {totalInView}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">In selected period</div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-mono flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar size={12} />
            </div>
            <span>Daily Average</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats.summary.averageDaily}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Patients per day</div>
        </div>

        <div className="bg-secondary/40 border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground uppercase font-mono flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award size={12} />
            </div>
            <span>Peak Day Intake</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1 flex items-baseline gap-2">
            <span>{stats.summary.peakDay.count}</span>
            <span className="text-xs text-muted-foreground font-normal font-sans">
              ({stats.summary.peakDay.formattedDate})
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Highest recorded intake</div>
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="relative bg-secondary/30 border border-border rounded-xl p-5 pt-8 w-full max-w-full min-w-0 overflow-hidden">
        <div className="h-44 sm:h-52 flex items-end gap-2 justify-between overflow-x-auto scrollbar-hidden min-w-0 max-w-full">
          {filteredData.map((day) => {
            const heightPercent = Math.max((day.count / maxCount) * 100, 6);
            const isHovered = hoveredDay?.date === day.date;
            const hasData = day.count > 0;

            return (
              <div
                key={day.date}
                className="flex-1 min-w-[18px] flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => onSelectDay?.(day.date)}
              >
                {/* Count Badge on Top of Bar */}
                <div
                  className={cn(
                    'text-[0.68rem] font-mono mb-1 transition-all',
                    hasData ? 'font-bold text-primary' : 'text-muted-foreground opacity-60',
                    isHovered ? 'scale-125 font-extrabold text-foreground' : ''
                  )}
                >
                  {day.count}
                </div>

                {/* Animated Bar Column */}
                <div className="w-full max-w-[28px] bg-secondary rounded-t-sm overflow-hidden flex items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      'w-full rounded-t-sm transition-all duration-300',
                      isHovered
                        ? 'bg-primary shadow-sm shadow-primary/50'
                        : hasData
                        ? 'bg-primary/80'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  />
                </div>

                {/* Day of Month / Label */}
                <div
                  className={cn(
                    'mt-2 text-[0.65rem] font-mono transition-colors text-center truncate w-full',
                    isHovered ? 'text-primary font-bold' : 'text-muted-foreground'
                  )}
                >
                  {day.date.split('-').slice(1).join('/')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredDay && (
          <div className="mt-4 p-3.5 bg-card border border-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="font-semibold text-foreground">{hoveredDay.formattedDate}</span>
              <span className="text-muted-foreground">({hoveredDay.date})</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-mono',
                  hoveredDay.count > 0
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-border text-muted-foreground'
                )}
              >
                {hoveredDay.count} Patient{hoveredDay.count === 1 ? '' : 's'} Admitted
              </Badge>
            </div>
            {hoveredDay.patients.length > 0 ? (
              <div className="text-muted-foreground font-mono text-xs">
                Patients: <span className="text-foreground font-semibold">{hoveredDay.patients.join(', ')}</span>
              </div>
            ) : (
              <div className="text-muted-foreground italic text-xs">No admissions recorded on this date</div>
            )}
          </div>
        )}
      </div>

      {/* Quick Day Breakdown List */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold">
          <span>Recent Admission Log by Day</span>
          <span>Admitted Count</span>
        </div>
        <div className="divide-y divide-border max-h-48 overflow-y-auto overflow-x-hidden">
          {filteredData
            .slice()
            .reverse()
            .map((day) => (
              <div
                key={day.date}
                className="px-5 py-2.5 flex items-center justify-between text-xs hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => onSelectDay?.(day.date)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground text-xs w-24">{day.date}</span>
                  <span className="font-medium text-foreground">{day.formattedDate}</span>
                  {day.patients.length > 0 && (
                    <span className="text-muted-foreground text-xs hidden md:inline truncate max-w-xs">
                      &bull; {day.patients.join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={day.count > 0 ? 'default' : 'outline'}
                    className="font-mono text-xs"
                  >
                    {day.count} admitted
                  </Badge>
                  <ChevronRight size={13} className="text-muted-foreground" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DailyPatientAdmissionsGraph;
