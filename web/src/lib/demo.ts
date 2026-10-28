import { ApiError, type Plan, type Task, type AuditEvent, type PlanPriority } from './api';
import { getStoredRole } from './auth';

type Intake = { asset: string; startTime: string; endTime: string; priority: PlanPriority; notes?: string | null };
// Deliberately ephemeral: refresh starts a new exercise, never an operational record.
let plans: Plan[] = [];
let tasks: Task[] = [];
let events: AuditEvent[] = [];
export function resetDemo() { plans = []; tasks = []; events = []; }
function audit(action: string, summary: string, correlationId: string, details: Record<string, unknown>) {
  events.unshift({ eventId: crypto.randomUUID(), eventType: 'AuditEvent.v1', timestamp: new Date().toISOString(),
    correlationId, actor: `demo-${getStoredRole()?.toLowerCase()}`, action, summary, details });
}
function requireRole(allowed: string[]) {
  if (!allowed.includes(getStoredRole() ?? '')) throw new ApiError(403, `This view requires ${allowed.join(' or ')}. Choose that role above.`);
}
function validate(p: Intake) {
  const errors: string[] = [];
  const start = Date.parse(p.startTime), end = Date.parse(p.endTime), now = Date.now();
  if (!p.asset.trim()) errors.push('Asset is required.');
  if (!['ROUTINE', 'PRIORITY', 'CRITICAL'].includes(p.priority)) errors.push('Choose a valid priority.');
  if (!Number.isFinite(start) || !Number.isFinite(end)) errors.push('Valid start and end times are required.');
  else {
    if (start < now) errors.push('Start time must be in the future.');
    if (start > now + 14 * 86400000) errors.push('Start time must be within the next 14 days.');
    if (end <= start) errors.push('End time must be after start time.');
    else if (end - start < 1800000 || end - start > 21600000) errors.push('Window duration must be between 30 minutes and 6 hours.');
  }
  if (p.priority === 'CRITICAL' && (p.notes?.trim().length ?? 0) < 20) errors.push('Critical plans require notes of at least 20 characters.');
  if (errors.length) throw new ApiError(422, 'Plan constraints failed.', errors);
}
export async function demoRequest<T>(path: string, init: RequestInit = {}): Promise<{data: T; correlationId: string}> {
  const correlationId = crypto.randomUUID();
  const url = new URL(path, 'https://demo.invalid');
  let data: unknown;
  if (url.pathname === '/api/plans' && init.method === 'POST') {
    requireRole(['PLANNER']);
    const intake = JSON.parse(String(init.body)) as Intake;
    validate(intake);
    const plan: Plan = { ...intake, asset: intake.asset.trim(), id: crypto.randomUUID(), status: 'DRAFT',
      createdBy: 'demo-planner', createdAt: new Date().toISOString(), correlationId };
    plans.unshift(plan);
    audit('PLAN_CREATED', `Draft created for ${plan.asset}`, correlationId, { planId: plan.id });
    data = plan;
  } else if (/^\/api\/plans\/[^/]+\/approve$/.test(url.pathname)) {
    requireRole(['PLANNER']);
    const plan = plans.find(p => p.id === url.pathname.split('/')[3]);
    if (!plan) throw new ApiError(404, 'Plan not found. Refresh may have reset this exercise.');
    if (plan.status === 'APPROVED') throw new ApiError(409, 'Plan is already approved.');
    validate(plan);
    plan.status = 'APPROVED'; plan.approvedAt = new Date().toISOString(); plan.approvedBy = 'demo-planner'; plan.correlationId = correlationId;
    audit('PLAN_APPROVED', `Approved window for ${plan.asset}`, correlationId, { planId: plan.id, simulatedEvent: 'PlanApproved.v1' });
    const task: Task = { id: crypto.randomUUID(), planId: plan.id, asset: plan.asset, windowStart: plan.startTime,
      windowEnd: plan.endTime, priority: plan.priority, status: 'READY', createdBy: 'simulated-ops', createdAt: new Date().toISOString(), correlationId };
    tasks.unshift(task);
    audit('TASK_CREATED', `Task issued for ${plan.asset}`, correlationId, { planId: plan.id, taskId: task.id, simulatedEvent: 'OpsTaskCreated.v1' });
    data = plan;
  } else if (url.pathname === '/api/plans') {
    requireRole(['PLANNER', 'EXEC']); data = plans;
  } else if (url.pathname === '/api/tasks') {
    requireRole(['OPS', 'EXEC']); data = tasks;
  } else if (url.pathname === '/api/audit') {
    requireRole(['AUDITOR', 'EXEC']);
    data = events.filter(e => ['correlationId', 'actor', 'action'].every(key => !url.searchParams.get(key) || e[key as 'action'] === url.searchParams.get(key)));
  } else throw new ApiError(404, 'Unknown demo operation.');
  return { data: structuredClone(data) as T, correlationId };
}
