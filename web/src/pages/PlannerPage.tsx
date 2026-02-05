import { useEffect, useMemo, useState } from 'react';
import { ClipboardSignature, Orbit, Send } from 'lucide-react';
import { ApiError, Plan, PlanPriority, createPlan, getPlans, approvePlan } from '../lib/api';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';

const priorityOptions: PlanPriority[] = ['ROUTINE', 'PRIORITY', 'CRITICAL'];

const toLocalInputValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function PlannerPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState({
    asset: 'AURORA-7',
    startTime: toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)),
    endTime: toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000)),
    priority: 'PRIORITY' as PlanPriority,
    notes: 'Scheduled imaging window for coastal survey.',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [lastCorrelation, setLastCorrelation] = useState<string | null>(null);

  const loadPlans = async () => {
    const response = await getPlans();
    setPlans(response.data);
  };

  useEffect(() => {
    loadPlans().catch(console.error);
  }, []);

  const approvedCount = useMemo(
    () => plans.filter((plan) => plan.status === 'APPROVED').length,
    [plans]
  );

  const handleCreate = async () => {
    setErrors([]);
    setIsLoading(true);
    try {
      if (!formState.startTime || !formState.endTime) {
        setErrors(['Start and end times are required.']);
        return;
      }
      const payload = {
        ...formState,
        startTime: new Date(formState.startTime).toISOString(),
        endTime: new Date(formState.endTime).toISOString(),
      };
      const response = await createPlan(payload);
      setLastCorrelation(response.correlationId);
      await loadPlans();
    } catch (err) {
      if (err instanceof ApiError) {
        const constraintErrors = Array.isArray(err.errors)
          ? err.errors.map((item) => (typeof item === 'string' ? item : item.message || item.code))
          : [err.message];
        setErrors(constraintErrors.filter(Boolean));
        setLastCorrelation(err.correlationId ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (planId: string) => {
    setIsLoading(true);
    setErrors([]);
    try {
      const response = await approvePlan(planId);
      setLastCorrelation(response.correlationId);
      await loadPlans();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors([err.message]);
        setLastCorrelation(err.correlationId ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mission Planner"
        title="Plan, validate, and approve mission windows"
        subtitle="Planner enforces three mission constraints before approval: window timing, duration limits, and critical-priority justification."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Create Plan</div>
              <h2 className="text-xl font-semibold">Mission Window Intake</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink/60">
              <Orbit className="h-4 w-4 text-accent" />
              {approvedCount} approved / {plans.length} total
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="data-label">Asset</span>
              <input
                value={formState.asset}
                onChange={(event) => setFormState({ ...formState, asset: event.target.value })}
                className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="data-label">Priority</span>
              <select
                value={formState.priority}
                onChange={(event) =>
                  setFormState({ ...formState, priority: event.target.value as PlanPriority })
                }
                className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm">
              <span className="data-label">Start (UTC)</span>
              <input
                type="datetime-local"
                value={formState.startTime}
                onChange={(event) => setFormState({ ...formState, startTime: event.target.value })}
                className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="data-label">End (UTC)</span>
              <input
                type="datetime-local"
                value={formState.endTime}
                onChange={(event) => setFormState({ ...formState, endTime: event.target.value })}
                className="w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm sm:col-span-2">
              <span className="data-label">Notes</span>
              <textarea
                value={formState.notes}
                onChange={(event) => setFormState({ ...formState, notes: event.target.value })}
                className="h-24 w-full rounded-xl border border-cloud/70 bg-surface px-3 py-2 text-sm"
              />
            </label>
          </div>

          {errors.length > 0 && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              <div className="font-semibold">Constraint feedback</div>
              <ul className="mt-2 list-disc pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface transition hover:bg-ink/90"
            >
              <Send className="h-4 w-4" />
              Submit Plan
            </button>
            {lastCorrelation && <CopyButton text={lastCorrelation} label="Copy correlation" />}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title">Approvals</div>
              <h2 className="text-xl font-semibold">Plan Queue</h2>
            </div>
            <ClipboardSignature className="h-5 w-5 text-accent" />
          </div>

          <div className="mt-6 space-y-4">
            {plans.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cloud/80 p-6 text-sm text-ink/60">
                No plans yet. Create the first mission window to populate the queue.
              </div>
            ) : (
              plans.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-cloud/70 bg-surface/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{plan.id}</div>
                      <div className="text-xs text-ink/60">{plan.asset}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={plan.status}
                        tone={plan.status === 'APPROVED' ? 'success' : 'warning'}
                      />
                      <StatusBadge label={plan.priority} />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-ink/60">
                    Window: {new Date(plan.startTime).toLocaleString()} → {new Date(plan.endTime).toLocaleString()}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <CopyButton text={plan.correlationId ?? ''} label="Copy correlation" />
                    {plan.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(plan.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink/80 transition hover:border-ink/40"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
