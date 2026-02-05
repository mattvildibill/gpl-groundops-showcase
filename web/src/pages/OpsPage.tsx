import { useEffect, useMemo, useState } from 'react';
import { Radar, Rows3 } from 'lucide-react';
import { Task, getTasks } from '../lib/api';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

export default function OpsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadTasks = async () => {
    const response = await getTasks();
    setTasks(response.data);
    if (response.data.length > 0) {
      setSelectedId((current) => current ?? response.data[0].id);
    }
  };

  useEffect(() => {
    loadTasks().catch(console.error);
    const interval = setInterval(() => loadTasks().catch(console.error), 5000);
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
        title="Event-driven tasking tickets"
        subtitle="Ops listens for PlanApproved events, issues tasking tickets, and publishes OpsTaskCreated."
      />

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
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
                No tasking tickets yet. Approve a plan to create one.
              </div>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedId(task.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedId === task.id
                      ? 'border-accent/50 bg-accent/10 shadow-glow'
                      : 'border-cloud/70 bg-surface/80 hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{task.id}</div>
                      <div className="text-xs text-ink/60">Plan {task.planId}</div>
                    </div>
                    <StatusBadge label={task.status} tone="success" />
                  </div>
                  <div className="mt-2 text-xs text-ink/60">{task.asset}</div>
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
                  <CopyButton text={selectedTask.correlationId ?? ''} label="Copy correlation" />
                </div>
              </div>

              <div className="rounded-xl border border-cloud/70 bg-surface/70 p-4 text-sm text-ink/70">
                <div className="font-semibold text-ink">Derived Details</div>
                <ul className="mt-2 list-disc pl-5">
                  <li>Priority routing set to {selectedTask.priority.toLowerCase()} track.</li>
                  <li>Payload alignment window validated against planner window.</li>
                  <li>Correlation ID attached to downstream telemetry handoff.</li>
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
