import { useEffect, useState } from 'react';
import { Activity, Gauge, TrendingUp } from 'lucide-react';
import { AuditEvent, Plan, Task, getAuditEvents, getPlans, getTasks } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export default function ExecutiveSummaryPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const [plansResponse, tasksResponse, auditResponse] = await Promise.all([
        getPlans(),
        getTasks(),
        getAuditEvents(),
      ]);
      setPlans(plansResponse.data);
      setTasks(tasksResponse.data);
      setEvents(auditResponse.data.slice(0, 5));
    };
    load().catch(console.error);
  }, []);

  const approved = plans.filter((plan) => plan.status === 'APPROVED').length;
  const total = plans.length;
  const readiness = total === 0 ? 0 : Math.round((approved / total) * 100);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Executive Summary"
        title="Mission readiness at a glance"
        subtitle="Summarizes mission pipeline health, ops throughput, and recent audit activity."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="section-title">Readiness</div>
            <Gauge className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-4 text-4xl font-semibold text-ink">{readiness}%</div>
          <div className="mt-3 h-2 w-full rounded-full bg-cloud/70">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-accent to-accentStrong"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <div className="mt-4 text-sm text-ink/60">
            {approved} approved of {total} planned missions
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="section-title">Ops Throughput</div>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-ink">{tasks.length}</div>
          <div className="mt-2 text-sm text-ink/60">Active tasking tickets issued</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge label="AUTO ROUTED" tone="success" />
            <StatusBadge label="JMS VERIFIED" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="section-title">Planner Health</div>
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-4 text-3xl font-semibold text-ink">{total}</div>
          <div className="mt-2 text-sm text-ink/60">Total plans in mission board</div>
          <div className="mt-4 text-xs text-ink/60">Constraints enforced in planner-service</div>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="section-title">What Changed</div>
            <h2 className="text-xl font-semibold">Last 5 audit events</h2>
          </div>
          <StatusBadge label="LIVE" tone="success" />
        </div>
        <div className="mt-6 space-y-3">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
              No audit activity yet. Create and approve a plan to generate events.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.eventId} className="flex items-start gap-4 rounded-xl border border-cloud/70 bg-surface/80 p-4">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{event.summary}</div>
                  <div className="mt-1 text-xs text-ink/60">
                    {event.action} • {event.actor} • {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
