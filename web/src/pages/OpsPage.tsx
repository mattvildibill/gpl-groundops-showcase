import { EvidenceLink } from '../components/EvidenceLink';
import { useEffect, useMemo, useState } from 'react';
import { Radar, Rows3 } from 'lucide-react';
import { Task, getTasks } from '../lib/api';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export default function OpsPage() {
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTasks = async () => {
    const response = await getTasks();
    setTasks(response.data);
    setLoaded(true);
    setError('');
    if (response.data.length > 0) {
      setSelectedId((current) => current ?? response.data[0].id);
    }
  };

  useEffect(() => {
    loadTasks().catch((err) => { setError(err.message || 'Unable to load tasks.'); setLoaded(true); });
    const interval = setInterval(() => loadTasks().catch((err) => { setError(err.message || 'Unable to load tasks.'); setLoaded(true); }), 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? tasks[0],
    [tasks, selectedId]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ops Tasking"
        title="Operations tickets"
        subtitle="Work tickets created from approved mission windows. These record the handoff, not a completed survey."
      />

      {error && <p role="alert" className="card p-4 text-warning">{error} Retrying every five seconds.</p>}
      <p className="text-sm text-ink/70">Repeated delivery is deduplicated while Ops remains running. This view checks for new tickets every five seconds.</p>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Queue</div>
              <h2 className="text-xl font-semibold">Active Tasking</h2>
            </div>
            <Rows3 className="h-5 w-5 text-accent" />
          </div>
          <div className="mt-6 space-y-3">
            {!loaded ? <p role="status">Loading tickets…</p> : error ? <p>Task queue unavailable.</p> : tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
                No tickets yet. Return to Mission workspace to approve a mission or resume a delayed delivery.
              </div>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  aria-pressed={selectedTask?.id === task.id}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedId === task.id
                      ? 'border-accent/50 bg-accent/10 shadow-glow'
                      : 'border-cloud/70 bg-surface/80 hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{task.asset}</div>
                      <div className="text-xs text-ink/60">Plan {task.planId}</div>
                    </div>
                    <StatusBadge label={task.status} tone="success" />
                  </div>
                  <div className="mt-2 text-xs font-mono text-ink/60">{task.id}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Detail</div>
              <h2 className="text-xl font-semibold">Tasking Ticket</h2>
            </div>
            <Radar className="h-5 w-5 text-accent" />
          </div>

          {selectedTask ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-cloud/70 bg-surface/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{selectedTask.id}</div>
                    <div className="text-xs text-ink/60">Derived from {selectedTask.planId}</div>
                  </div>
                  <StatusBadge label={selectedTask.priority} />
                </div>
                <div className="mt-3 text-xs text-ink/60">
                  Window: {new Date(selectedTask.windowStart).toLocaleString()} →{' '}
                  {new Date(selectedTask.windowEnd).toLocaleString()}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-ink/70">Operator: {selectedTask.createdBy}</div>
                  <EvidenceLink trace={selectedTask.correlationId}>Trace handoff</EvidenceLink>
                  <CopyButton text={selectedTask.correlationId ?? ''} label="Copy correlation" />
                </div>
              </div>

              <div className="rounded-xl border border-cloud/70 bg-surface/70 p-4 text-sm text-ink/70">
                <div className="font-semibold text-ink">What the handoff carries</div>
                <ul className="mt-2 list-disc pl-5">
                  <li>Priority routing set to {selectedTask.priority.toLowerCase()} track.</li>
                  <li>The mission window is copied from the approved plan.</li>
                  <li>The approval correlation ID connects this ticket to its audit events.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
              Select a tasking ticket to inspect details.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
