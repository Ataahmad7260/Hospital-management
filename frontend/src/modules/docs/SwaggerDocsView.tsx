import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, Terminal, CheckCircle2 } from 'lucide-react';
import { Card } from '../../shared/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { API_ORIGIN } from '../../shared/api';

export const SwaggerDocsView: React.FC = () => {
  const swaggerUrl = `${API_ORIGIN}/api/docs/swagger`;
  const postmanUrl = `${API_ORIGIN}/api/docs`;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground flex flex-wrap items-center gap-2">
              Swagger OpenAPI 3.0 Interactive Documentation
              <Badge variant="success">OPENAPI 3.0 LIVE</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete interactive API specification with live request testing, DTO validation schemas, and RBAC Bearer authorization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <a
              href={swaggerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Open Swagger in New Tab</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Specs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-xs shadow-xs min-w-0">
          <div className="text-muted-foreground uppercase text-[0.68rem] flex items-center gap-1.5">
            <Terminal size={13} className="text-primary" />
            <span className="font-sans font-medium text-foreground">Interactive Endpoint</span>
          </div>
          <div className="text-primary font-bold text-sm mt-1 truncate">{swaggerUrl}</div>
          <div className="text-muted-foreground text-[0.68rem] mt-0.5">Alternative route: /swagger</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 font-mono text-xs shadow-xs min-w-0">
          <div className="text-muted-foreground uppercase text-[0.68rem] flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span className="font-sans font-medium text-foreground">Authentication Scheme</span>
          </div>
          <div className="text-emerald-400 font-bold text-sm mt-1">Bearer JWT Security</div>
          <div className="text-muted-foreground text-[0.68rem] mt-0.5">Authorization header with JWT</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 font-mono text-xs shadow-xs min-w-0">
          <div className="text-muted-foreground uppercase text-[0.68rem] flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-sky-400" />
            <span className="font-sans font-medium text-foreground">Active Endpoints</span>
          </div>
          <div className="text-foreground font-bold text-sm mt-1">Patients, Rx, Billing, Tracking</div>
          <div className="text-muted-foreground text-[0.68rem] mt-0.5">Full CRUD & telemetry routes</div>
        </div>
      </div>

      {/* Embedded Iframe Preview */}
      <Card
        title="Interactive Swagger UI Live Preview"
        subtitle="Explore and execute API calls directly from your browser"
        icon={<BookOpen size={18} className="text-primary" />}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={postmanUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Postman Hub
              </a>
            </Button>
            <Button size="sm" asChild>
              <a
                href={swaggerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <ExternalLink size={12} /> Fullscreen
              </a>
            </Button>
          </div>
        }
      >
        <div className="w-full h-[650px] rounded-lg overflow-hidden border border-border bg-card">
          <iframe
            src={swaggerUrl}
            title="AURA Swagger UI"
            className="w-full h-full border-0"
          />
        </div>
      </Card>
    </div>
  );
};
