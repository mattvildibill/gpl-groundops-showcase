import { useEffect, useRef, useState } from 'react';
import { EvidenceLink } from './EvidenceLink';
import { missionSnapshot, resumeHandoff, replayHandoff } from '../lib/demo';
import { getStoredRole } from '../lib/auth';
import { CopyButton } from './CopyButton';

const time = (value: string) => new Date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
type Props = { active?: boolean; selectedPlanId?: string; onSelect?: (id:string) => void; onApprove?: (id:string) => void; busy?: boolean; delay?: boolean; onDelayChange?: (value:boolean) => void; onRecovered?: () => void };
export function MissionTimeline({active = true, selectedPlanId, onSelect, onApprove, busy, delay, onDelayChange, onRecovered}: Props) {
  const [,refresh] = useState(0);
  const [feedback,setFeedback] = useState({planId:'',text:''});
  const [selection,setSelection] = useState('');
  const snapshot = missionSnapshot();
  const plan = snapshot.plans.find(p => p.id === (selectedPlanId ?? selection)) ?? snapshot.plans[0];
  const task = snapshot.tasks.find(t => t.planId === plan?.id);
  const pending = !!plan && snapshot.pending.includes(plan.id);
  const recovered = !!plan && snapshot.recovered.includes(plan.id);
  const canControl = ['PLANNER','OPS'].includes(getStoredRole() ?? '');
  const stage = !plan ? 0 : plan.status === 'DRAFT' ? 1 : pending ? 2 : 3;
  const actionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (active && stage > 0) actionHeading.current?.focus();
  }, [stage, active]);
  const titles = ['Start with a survey window','Ready for your approval','Approved · awaiting handoff','Operations ticket issued'];
  const act = (replay:boolean) => {
    if (!plan) return;
    try {
      if (replay) replayHandoff(plan.id); else resumeHandoff(plan.id);
      setFeedback({planId:plan.id,text:replay ? 'Duplicate delivery ignored. The same ticket and audit evidence remain.' : 'Delivery resumed. Each waiting mission now has one ticket.'});
      refresh(n=>n+1); onRecovered?.();
    } catch(e) {setFeedback({planId:plan.id,text:e instanceof Error ? e.message : 'Recovery failed.'});}
  };
  return <section className="card p-4 sm:p-5" aria-label="Mission handoff timeline">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Mission progress</h2><span className="text-xs text-ink/60">{plan ? plan.asset : 'Coastal survey example'}</span></div>
    {snapshot.plans.length > 1 && <label className="mt-3 block text-sm">Mission <select className="ml-2 max-w-full rounded border p-2" value={plan?.id} onChange={e=>{setSelection(e.target.value);onSelect?.(e.target.value);setFeedback({planId:'',text:''});}}>{snapshot.plans.map(p=><option key={p.id} value={p.id}>{p.asset} · {p.id}</option>)}</select></label>}
    <ol className="mission-steps" aria-label="Mission stages">{['Plan','Approve','Send','Ticket'].map((label,i)=><li key={label} aria-current={stage===i ? 'step' : undefined} className={i<stage || task ? 'complete' : stage===i ? 'current' : ''}><span>{i<stage || task ? '✓' : i+1}</span><b>{label}</b></li>)}</ol>
    <div className={`next-action ${pending ? 'waiting' : task ? 'delivered' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">{task ? 'Result' : 'Next action'}</p>
      <h3 ref={actionHeading} tabIndex={-1} className="mt-1 text-xl font-semibold">{titles[stage]}</h3>
      {!plan && <p className="mt-2 text-sm text-ink/70">Save the example mission to begin. A mission is a request to reserve time for a satellite survey.</p>}
      {plan?.status === 'DRAFT' && <>
        <p className="mt-2 text-sm text-ink/70">Approval gives operations permission to prepare a work ticket. It does not mean the survey has happened.</p>
        {onApprove && <>
          <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={delay} onChange={e=>onDelayChange?.(e.target.checked)} className="mt-1" /><span>Try a delivery delay<span className="block mt-1 text-xs text-ink/60">Pause the simulated receiving service. Recover it in the next step.</span></span></label>
          <button className="primary-action mt-4" disabled={busy} onClick={()=>onApprove(plan.id)}>{busy ? 'Approving…' : 'Approve mission'}</button>
        </>}
      </>}
      {pending && <>
        <p className="mt-2 text-sm text-ink/70">The mission is approved, but the receiving service is paused. No ticket exists yet. Resume delivery; you do not need to approve again.</p>
        {canControl && <button className="primary-action mt-4" onClick={()=>act(false)}>Resume delivery</button>}
        <p className="mt-2 text-xs text-ink/60">Browser scenario control · {snapshot.pending.length} queued approval(s).</p>
      </>}
      {task && <>
        <p className="mt-2 text-sm text-ink/70">Operations received the approved window and created a work ticket. The handoff is complete; the survey itself is not simulated.</p>
        <div className="ticket-receipt"><b>{task.id}</b><span>{recovered ? 'Recovered' : 'Delivered'} · {time(task.createdAt)}</span><span>{new Date(task.windowStart).toLocaleString()} → {new Date(task.windowEnd).toLocaleString()}</span></div>
        {canControl && <button className="secondary-action mt-3" onClick={()=>act(true)}>Try duplicate delivery</button>}
        <p className="mt-2 text-xs text-ink/60">Send the same approval again. It should reuse this ticket.</p>
      </>}
    </div>
    {feedback.planId===plan?.id && feedback.text && <p role="status" className="mt-3 text-sm">{feedback.text}</p>}
    {plan && <details className="mt-4 text-sm"><summary className="cursor-pointer underline underline-offset-4">History & technical evidence</summary>
      <ol className="mt-3 space-y-2 text-sm"><li>{time(plan.createdAt)} · Mission saved</li>{plan.approvedAt && <li>{time(plan.approvedAt)} · Window approved</li>}{task && <li>{time(task.createdAt)} · Ticket {task.id} created</li>}</ol>
      <p className="mt-3 text-xs text-ink/70">Plan {plan.id}. Approval and ticket share this trace ID; draft creation is a separate request.</p>
      <p className="mt-2 break-all font-mono text-xs">{plan.correlationId}</p>
      <div className="mt-2 flex flex-wrap gap-3 items-center"><CopyButton text={plan.correlationId ?? ''} label="Copy mission trace" /><EvidenceLink trace={plan.correlationId}>Open audit evidence</EvidenceLink></div>
      <p className="mt-3 text-xs text-ink/70">Cross-service browser evidence, independent of Java API permissions. Real Artemis tests verify paused consumption, failed-publication retry and duplicate suppression. State and deduplication are in memory; restart recovery and exactly-once delivery are not claimed.</p>
    </details>}
  </section>;
}
