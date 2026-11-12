import React, { useEffect, useState } from 'react';
import {
  Activity,
  Compass,
  RefreshCw,
  Trash2,
  Send,
  CheckCircle2,
  Server,
  Layers,
  Clock,
  Shield,
} from 'lucide-react';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../shared/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '../../shared/api';
import type { PageTrackingStats } from '../../shared/types';
import { useAuth } from '../../shared/context/AuthContext';

export const ExpressPageTracker: React.FC = () => {
  const { showToast, role } = useAuth();
  const [stats, setStats] = useState<PageTrackingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testUrl, setTestUrl] = useState('/dashboard');
  const [testTitle, setTestTitle] = useState('Hospital Master Dashboard');

  useEffect(() => {
    loadStats();
    // Auto-record this telemetry view itself!
    api.recordPageHit({
      pageUrl: '/telemetry/express-page-tracker',
      pageTitle: 'Express.js Page Tracking Telemetry',
      userRole: role,
    }).catch(() => {});
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getPageTrackingStats();
      setStats(data);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendHit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.recordPageHit({
        pageUrl: testUrl,
        pageTitle: testTitle,
        userRole: role,
      });
      showToast(`Express hit recorded for: ${testUrl}`);
      loadStats();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleClear = async () => {
    try {
      await api.clearPageTrackingStats();
      showToast('Express page tracking stats buffer cleared');
      loadStats();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header and Telemetry Intro */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
            <Server size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              Express.js Route & Page View Tracker
              <Badge variant="success">ACTIVE MIDDLEWARE</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Live telemetry tracking SPA navigation, Express backend requests, user role scopes, and page load telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Trash2 size={13} />
            <span>Clear Telemetry</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground font-mono uppercase flex items-center gap-1.5">
            <Activity size={13} className="text-primary" />
            <span className="font-sans font-medium text-foreground">Total Hits</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats?.totalViews ?? 0}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">Recorded via Express</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground font-mono uppercase flex items-center gap-1.5">
            <Compass size={13} className="text-sky-400" />
            <span className="font-sans font-medium text-foreground">Unique Routes</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {stats?.uniquePages ?? 0}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">Distinct URLs visited</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground font-mono uppercase flex items-center gap-1.5">
            <Layers size={13} className="text-amber-400" />
            <span className="font-sans font-medium text-foreground">Top Route</span>
          </div>
          <div className="text-sm font-bold font-mono text-foreground mt-1 truncate" title={stats?.topPages?.[0]?.url || 'N/A'}>
            {stats?.topPages?.[0]?.url || 'None yet'}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5 font-mono">
            {stats?.topPages?.[0]?.count ? `${stats.topPages[0].count} hits` : 'No data'}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground font-mono uppercase flex items-center gap-1.5">
            <Shield size={13} className="text-emerald-400" />
            <span className="font-sans font-medium text-foreground">Active Roles</span>
          </div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">
            {Object.keys(stats?.viewsByRole || {}).join(', ') || role}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">RBAC tracked sessions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Visited Pages List */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Page Traffic & Access Breakdown"
            subtitle="Hit frequencies per page route"
            icon={<Compass size={18} className="text-primary" />}
          >
            <div className="space-y-3">
              {(stats?.topPages || []).map((page, idx) => {
                const total = stats?.totalViews || 1;
                const pct = Math.round((page.count / total) * 100);

                return (
                  <div key={idx} className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-medium text-foreground truncate max-w-md">{page.url}</span>
                      <span className="font-mono text-muted-foreground font-semibold">{page.count} hits ({pct}%)</span>
                    </div>
                    {/* Visual Progress bar */}
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {(!stats?.topPages || stats.topPages.length === 0) && (
                <div className="text-center text-muted-foreground py-8 text-xs font-mono">
                  No telemetry pages recorded yet. Navigate portals or send a test hit below.
                </div>
              )}
            </div>
          </Card>

          {/* Live Recent Views Log */}
          <Card
            title="Live Telemetry Activity Log"
            subtitle="Recent route hits registered through Express"
            icon={<Clock size={18} className="text-sky-400" />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Route / URL</TableHead>
                  <TableHead>Page Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.recentViews || []).slice(0, 15).map((view) => (
                  <TableRow key={view.id}>
                    <TableCell className="font-mono text-muted-foreground text-[0.68rem]">
                      {new Date(view.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium text-foreground text-xs">{view.pageUrl}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{view.pageTitle}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[0.62rem]">
                        {view.userRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-[0.68rem]">
                      {view.ipAddress}
                    </TableCell>
                  </TableRow>
                ))}

                {(!stats?.recentViews || stats.recentViews.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs font-mono">
                      No live telemetry hits recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Sidebar Panel: Test Hit & Telemetry Controls */}
        <div className="space-y-6">
          <Card
            title="Simulate Page Hit"
            subtitle="Trigger an Express page track request"
            icon={<Send size={18} className="text-primary" />}
          >
            <form onSubmit={handleSendHit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Preset Route:</label>
                <select
                  value={testUrl}
                  onChange={(e) => {
                    setTestUrl(e.target.value);
                    if (e.target.value === '/dashboard') setTestTitle('Hospital Master Dashboard');
                    if (e.target.value === '/patients/admit') setTestTitle('Patient Admission & Intake');
                    if (e.target.value === '/patients/overview') setTestTitle('Patient Admission Overview & History');
                    if (e.target.value === '/doctor/consultations') setTestTitle('Doctor Consultation Queue');
                    if (e.target.value === '/pharmacist/dispensary') setTestTitle('Pharmacist Dispensary Queue');
                  }}
                  className="w-full bg-background border border-input rounded-md p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="/dashboard">/dashboard (Hospital Dashboard)</option>
                  <option value="/patients/admit">/patients/admit (Patient Admission)</option>
                  <option value="/patients/overview">/patients/overview (Patient Overview)</option>
                  <option value="/doctor/consultations">/doctor/consultations (Doctor Queue)</option>
                  <option value="/pharmacist/dispensary">/pharmacist/dispensary (Dispensary)</option>
                  <option value="/swagger">/swagger (OpenAPI Swagger UI)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Custom Route Path:</label>
                <Input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Page Title:</label>
                <Input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle2 size={14} />
                <span>Send Express Telemetry Hit</span>
              </Button>
            </form>
          </Card>

          {/* Role traffic chart */}
          <Card
            title="Hits by User Role"
            subtitle="Distribution of role traffic"
            icon={<Shield size={18} className="text-emerald-400" />}
          >
            <div className="space-y-2">
              {Object.entries(stats?.viewsByRole || {}).map(([r, count]) => (
                <div key={r} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="font-mono font-medium text-foreground">{r}</span>
                  <Badge variant="secondary">{count} hit(s)</Badge>
                </div>
              ))}
              {(!stats?.viewsByRole || Object.keys(stats.viewsByRole).length === 0) && (
                <div className="text-muted-foreground text-xs italic">No role telemetry yet</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
