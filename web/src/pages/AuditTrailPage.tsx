import { useEffect, useState } from 'react';
import { Filter, History } from 'lucide-react';
import { AuditEvent, getAuditEvents } from '../lib/api';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';

export default function AuditTrailPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filters, setFilters] = useState({
    correlationId: '',
    actor: '',
    action: '',
  });

  const loadEvents = async (override?: typeof filters) => {
    const response = await getAuditEvents({
      correlationId: override?.correlationId || filters.correlationId || undefined,
      actor: override?.actor || filters.actor || undefined,
      action: override?.action || filters.action || undefined,
    });
    setEvents(response.data);
  };

  useEffect(() => {
    loadEvents().catch(console.error);
  }, []);

  const handleReset = () => {
    const cleared = { correlationId: '', actor: '', action: '' };
    setFilters(cleared);
    loadEvents(cleared).catch(console.error);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Audit Trail"
        title="Searchable operational history"
        subtitle="Audit-service records append-only events with actor, action, and correlation identifiers."
      />

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-title">Filters</div>
            <h2 className="text-xl font-semibold">Event Query</h2>
          </div>
          <Filter className="h-5 w-5 text-accent" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="data-label">Correlation ID</span>
            <input
              value={filters.correlationId}
              onChange={(event) => setFilters({ ...filters, correlationId: event.target.value })}
              className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="data-label">Actor</span>
            <input
              value={filters.actor}
              onChange={(event) => setFilters({ ...filters, actor: event.target.value })}
              className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="data-label">Action</span>
            <input
              value={filters.action}
              onChange={(event) => setFilters({ ...filters, action: event.target.value })}
              className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadEvents().catch(console.error)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink/70"
          >
            Reset
          </button>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="section-title">Timeline</div>
            <h2 className="text-xl font-semibold">Audit Events</h2>
          </div>
          <History className="h-5 w-5 text-accent" />
        </div>
        <div className="mt-6 space-y-4">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
              No audit events match this filter.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.eventId} className="rounded-xl border border-cloud/70 bg-surface/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{event.summary}</div>
                    <div className="text-xs text-ink/60">
                      {event.action} • {event.actor} • {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <CopyButton text={event.correlationId} label="Copy correlation" />
                </div>
                <div className="mt-3 text-xs text-ink/60">
                  Event ID: {event.eventId}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
