import { useState } from 'react';
import { Link } from 'react-router-dom';
import { missionSnapshot, resumeHandoff, replayHandoff } from '../lib/demo';
import { getStoredRole } from '../lib/auth';
import { CopyButton } from './CopyButton';

const time = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function MissionTimeline({ onRecovered }: { onRecovered?: () => void }) {
  // Parent reads refresh the snapshot; scenario controls update it immediately.
  const [, refresh] = useState(0);
  const [feedback, setFeedback] = useState({ planId: '', text: '' });
  const snapshot = missionSnapshot();
  const [selected, setSelected] = useState('');
  const plan = snapshot.plans.find(p => p.id === selected) ?? snapshot.plans[0];
  const task = snapshot.tasks.find(t => t.planId === plan?.id);
  const pending = plan && snapshot.pending.includes(plan.id);
  const recovered = plan && snapshot.recovered.includes(plan.id);
  const canControl = ['PLANNER', 'OPS'].includes(getStoredRole() ?? '');
  const act = (replay: boolean) => {
    if (!plan) return;
    try {
      if (replay) replayHandoff(plan.id); else resumeHandoff(plan.id);
      setFeedback({planId: plan.id, text: replay ? 'Duplicate delivery ignored. The same ticket and audit evidence remain.' : 'Consumption resumed. Queued approvals produced their operations tickets.'});
      refresh(n => n + 1);
      onRecovered?.();
    } catch (error) { setFeedback({planId: plan.id, text: error instanceof Error ? error.message : 'Recovery failed.'}); }
  };
  return <section className="mission-timeline card p-5 sm:p-6" aria-label="Mission handoff timeline">
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div><p className="section-title">Coastal survey / handoff exercise</p>
        <h2 className="mt-1 text-2xl font-semibold">{plan?.asset ?? 'One window. One operations ticket.'}</h2>
        <p className="mt-2 text-sm text-ink/70">{plan ? `${new Date(plan.startTime).toLocaleString()} → ${new Date(plan.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${plan.priority.toLowerCase()}` : 'Submit the mission below, then approve it with Ops consumption delayed.'}</p>
      </div>
      {snapshot.plans.length > 1 && <label className="text-sm">Mission <select className="ml-2 rounded border p-2" value={plan?.id} onChange={e => { setSelected(e.target.value); setFeedback({planId:'', text:''}); }}>{snapshot.plans.map(p => <option key={p.id} value={p.id}>{p.asset} · {p.id}</option>)}</select></label>}
    </div>
    <ol className="mt-6 grid gap-3 sm:grid-cols-4">
      {[
        ['01', 'Planned', plan ? time(plan.createdAt) : 'Awaiting intake', !!plan],
        ['02', 'Approved', plan?.approvedAt ? time(plan.approvedAt) : 'Review window', !!plan?.approvedAt],
        ['03', 'Ops handoff', pending ? 'Awaiting consumption' : task ? recovered ? 'Recovered' : 'Delivered' : 'Approval required', !!task],
        ['04', 'Operations ticket', task ? `${task.id} · ${time(task.createdAt)}` : 'Not issued', !!task],
      ].map(([step, label, detail, complete]) => <li key={String(step)} className={`rounded-xl border p-3 ${complete ? 'border-accent/40 bg-accent/5' : 'border-cloud/70'}`}>
        <span className="text-xs font-mono text-ink/60">{step}</span><h3 className="mt-2 font-semibold text-sm">{label}</h3><p className="mt-1 text-xs text-ink/70">{detail}</p>
      </li>)}
    </ol>
    {pending && <div className="mt-4 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <p className="font-semibold text-sm">Approved · awaiting handoff</p>
      <p className="mt-1 text-sm text-ink/70">Ops consumption is paused in this exercise. The approval is queued; no ticket has been issued. Resume the shared consumer to retry all queued approvals without approving again.</p>
      {canControl && <button className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-surface" onClick={() => act(false)}>Resume Ops consumption</button>}
      <p className="mt-2 text-xs text-ink/60">Browser scenario control · {snapshot.pending.length} queued approval(s).</p>
    </div>}
    {feedback.planId === plan?.id && feedback.text && <p role="status" className="mt-3 text-sm">{feedback.text}</p>}
    {plan && <details className="mt-4 text-sm">
      <summary className="cursor-pointer underline underline-offset-4">Inspect handoff evidence</summary>
      <div className="mt-3 space-y-3 text-ink/70">
        <p>Plan {plan.id}{task ? ` → ticket ${task.id}` : ' → no ticket yet'}. Approval and task share a correlation ID; draft creation has its own request trace.</p>
        <p className="break-all font-mono text-xs">{plan.correlationId}</p>
        <div className="flex flex-wrap gap-3 items-center"><CopyButton text={plan.correlationId ?? ''} label="Copy mission trace" /><Link className="underline" to={`/audit?correlationId=${encodeURIComponent(plan.correlationId ?? '')}`}>Open audit evidence</Link>
          {task && canControl && <button className="rounded-full border border-ink/30 px-3 py-2" onClick={() => act(true)}>Replay duplicate delivery</button>}</div>
        <p className="text-xs">Cross-service scenario evidence, independent of Java API read permissions. Java tests use real Artemis to verify delayed consumption, retry after failed publication, and duplicate suppression. Records and deduplication are in memory; restart recovery and exactly-once delivery are not claimed.</p>
      </div>
    </details>}
  </section>;
}
