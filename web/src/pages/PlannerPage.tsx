import { useEffect, useRef, useState } from 'react';
import { ApiError, Plan, PlanPriority, createPlan, getPlans, approvePlan } from '../lib/api';
import { getStoredRole } from '../lib/auth';
import { DEMO_MODE } from '../lib/mode';
import { MissionTimeline } from '../components/MissionTimeline';
import { setHandoffDelay, missionSnapshot } from '../lib/demo';
import { CopyButton } from '../components/CopyButton';

const localInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function PlannerPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [delay, setDelay] = useState(true);
  const [editing, setEditing] = useState(false);
  const [composing, setComposing] = useState(() => !DEMO_MODE || missionSnapshot().plans.length === 0);
  const assetInput = useRef<HTMLInputElement>(null);
  const wasComposing = useRef(composing);
  useEffect(() => {
    if (composing && !wasComposing.current) assetInput.current?.focus();
    wasComposing.current = composing;
  }, [composing]);
  const [selectedId, setSelectedId] = useState('');
  const [trace, setTrace] = useState<string | null>(null);
  const [form, setForm] = useState({asset:'AURORA-7', startTime:localInput(new Date(Date.now()+3600000)),
    endTime:localInput(new Date(Date.now()+10800000)), priority:'PRIORITY' as PlanPriority, notes:'Scheduled imaging window for coastal survey.'});
  const selected = plans.find(p => p.id === selectedId) ?? plans[0];
  const canRead = ['PLANNER','EXEC'].includes(getStoredRole() ?? '');
  const canEdit = getStoredRole() === 'PLANNER';
  const load = async (initial = false) => { const response = await getPlans(); setPlans(response.data); setLoaded(true); setLoadError(''); if (initial && response.data.length) setComposing(false); };
  useEffect(() => { load(true).catch(e => { setLoadError(e.message); setLoaded(true); }); }, []);
  const report = (error: unknown) => {
    if (error instanceof ApiError) {
      setErrors(Array.isArray(error.errors) ? error.errors.map(item => typeof item === 'string' ? item : item.message || item.code) : [error.message]);
      setTrace(error.correlationId ?? null);
    } else setErrors([error instanceof Error ? error.message : 'Request failed. Please retry.']);
  };
  const save = async () => {
    setBusy(true); setErrors([]); setNotice('');
    try {
      if (!form.startTime || !form.endTime) { setErrors(['Start and end times are required.']); return; }
      const response = await createPlan({...form, startTime:new Date(form.startTime).toISOString(),endTime:new Date(form.endTime).toISOString()});
      setTrace(response.correlationId); setSelectedId(response.data.id); await load(); setComposing(false);
      setNotice('Mission saved. Review the window, then approve it.');
    } catch(e) { report(e); } finally { setBusy(false); }
  };
  const approve = async (id: string) => {
    setBusy(true); setErrors([]); setNotice('');
    try {
      if (DEMO_MODE) setHandoffDelay(delay);
      const response = await approvePlan(id); setTrace(response.correlationId); await load();
      if (!DEMO_MODE) setNotice('Approved. Check Operations tickets for the result.');
    } catch(e) { report(e); } finally { setBusy(false); }
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">From mission request to operations</h1><p className="mt-1 text-sm text-ink/70">Schedule a fictional satellite survey. Approve it, resolve a delivery delay, and inspect the ticket.</p></div>
      {plans.length > 0 && canEdit && <button className="secondary-action" onClick={() => {setComposing(true);setEditing(true);setErrors([]);setNotice('');}}>New mission</button>}
    </div>
    {loadError && <p role="alert" className="card p-4 text-warning">{loadError} <button className="underline" onClick={() => load().catch(e => setLoadError(e.message))}>Retry</button></p>}
    <div className={`mission-workspace ${composing ? 'is-composing' : ''}`}>
      <section className="card mission-input p-4 sm:p-5" aria-label="Mission details">
        {composing || !selected ? <>
          <h2 className="text-lg font-semibold">1. Plan the survey</h2>
          <p className="mt-1 text-sm text-ink/70">The example is ready to try.</p>
          <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><b>{form.asset}</b> · {form.priority.toLowerCase()}<p className="mt-1 text-xs text-ink/70">{form.startTime ? new Date(form.startTime).toLocaleString() : 'Choose a start'} → {form.endTime ? new Date(form.endTime).toLocaleString() : 'Choose an end'}</p><p className="mt-1 text-xs text-ink/70">Coastal survey · times in {Intl.DateTimeFormat().resolvedOptions().timeZone}</p></div>
          <form id="plan-intake" onSubmit={e => {e.preventDefault();void save();}} className="mt-4 grid gap-3 sm:grid-cols-2">
            <details className="sm:col-span-2" open={editing} onToggle={e=>setEditing(e.currentTarget.open)}><summary className="cursor-pointer text-sm underline underline-offset-4">Edit mission details</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="field-label"><span>Satellite / asset</span><input ref={assetInput} aria-label="Asset" required maxLength={80} value={form.asset} onChange={e => setForm({...form,asset:e.target.value})} /></label>
            <label className="field-label"><span>Priority</span><select aria-label="Priority" value={form.priority} onChange={e => setForm({...form,priority:e.target.value as PlanPriority})}>{(['ROUTINE','PRIORITY','CRITICAL'] as const).map(p => <option key={p}>{p}</option>)}</select></label>
            <label className="field-label"><span>Start (local time)</span><input type="datetime-local" required value={form.startTime} onChange={e => setForm({...form,startTime:e.target.value})} /></label>
            <label className="field-label"><span>End (local time)</span><input type="datetime-local" required value={form.endTime} onChange={e => setForm({...form,endTime:e.target.value})} /></label>
            <label className="field-label sm:col-span-2"><span>Notes</span><textarea rows={2} maxLength={500} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} /></label>
            <div className="sm:col-span-2 text-xs text-ink/60">Times: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Stored in UTC.</div>
            <details className="sm:col-span-2 text-xs text-ink/70"><summary className="cursor-pointer">Window rules</summary><p className="mt-2">Start within 14 days. Duration: 30 minutes–6 hours. Critical priority needs at least 20 characters of justification.</p></details>
            </div></details>
            <div className="flex flex-wrap gap-3 items-center sm:col-span-2"><button disabled={busy || !canEdit} className="primary-action" type="submit">{busy ? 'Saving…' : 'Save mission'}</button>{selected && <button className="text-sm underline" type="button" onClick={() => setComposing(false)}>Back to mission</button>}</div>
          </form>
        </> : <>
          <p className="section-title">Mission details</p><h2 className="mt-2 text-xl font-semibold">{selected.asset}</h2>
          <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-ink/60">Survey window</dt><dd>{new Date(selected.startTime).toLocaleString()}<br />to {new Date(selected.endTime).toLocaleString()}</dd></div><div><dt className="text-ink/60">Priority</dt><dd>{selected.priority}</dd></div><div><dt className="text-ink/60">Purpose</dt><dd>{selected.notes || 'No notes supplied.'}</dd></div></dl>
          <details className="mt-4 text-xs text-ink/70"><summary className="cursor-pointer">Plan reference</summary><p className="mt-2">{selected.id} · {selected.status}</p><CopyButton text={selected.correlationId ?? ''} label="Copy correlation" /></details>
        </>}
        {errors.length > 0 && <div role="alert" className="mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning"><b>Check the mission details</b><ul className="mt-1 list-disc pl-4">{errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
        {trace && errors.length > 0 && <CopyButton text={trace} label="Copy error trace" />}
      </section>
      <div className={`mission-progress ${!selected ? 'empty-progress' : ''}`}>
        {DEMO_MODE && canRead ? <MissionTimeline active={!!selected && !composing} selectedPlanId={selectedId} onSelect={id => {setSelectedId(id);setComposing(false);setNotice('');}} onApprove={canEdit ? approve : undefined} busy={busy} delay={delay} onDelayChange={setDelay} onRecovered={() => setNotice('')} /> : <section className="card p-5"><h2 className="text-lg font-semibold">Mission approvals</h2>{!loaded ? <p>Loading plans…</p> : loadError ? <p>Plan queue unavailable.</p> : plans.length === 0 ? <p className="mt-3 text-sm">No plans yet. Create the first mission window.</p> : plans.map(p => <div className="mt-3 rounded-lg border p-3" key={p.id}><b>{p.asset}</b><p className="text-sm">{new Date(p.startTime).toLocaleString()} · {p.status}</p>{p.status === 'DRAFT' && canEdit && <button className="primary-action mt-2" disabled={busy} onClick={() => void approve(p.id)}>Approve mission</button>}</div>)}</section>}
        {notice && !DEMO_MODE && <p role="status" className="mt-3 text-sm text-success">{notice}</p>}
      </div>
    </div>
  </div>;
}
