import { getStoredToken } from './auth';

export type PlanStatus = 'DRAFT' | 'APPROVED';
export type PlanPriority = 'ROUTINE' | 'PRIORITY' | 'CRITICAL';

export interface Plan {
  id: string;
  asset: string;
  startTime: string;
  endTime: string;
  priority: PlanPriority;
  notes?: string | null;
  status: PlanStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  correlationId?: string | null;
}

export interface Task {
  id: string;
  planId: string;
  asset: string;
  windowStart: string;
  windowEnd: string;
  priority: string;
  status: string;
  createdBy: string;
  createdAt: string;
  correlationId?: string | null;
}

export interface AuditEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  actor: string;
  action: string;
  summary: string;
  details: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  errors?: unknown;
  correlationId?: string | null;

  constructor(status: number, message: string, errors?: unknown, correlationId?: string | null) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.correlationId = correlationId;
  }
}

const PLANNER_URL = import.meta.env.VITE_PLANNER_URL || 'http://localhost:8080';
const OPS_URL = import.meta.env.VITE_OPS_URL || 'http://localhost:8081';
const AUDIT_URL = import.meta.env.VITE_AUDIT_URL || 'http://localhost:8082';

async function request<T>(base: string, path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  if (!token) {
    throw new ApiError(401, 'No token set. Choose a role to continue.');
  }

  const correlationId = crypto.randomUUID();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('X-Correlation-Id', correlationId);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${base}${path}`, { ...init, headers });
  const responseCorrelationId = response.headers.get('X-Correlation-Id') ?? correlationId;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = data?.detail || data?.title || 'Request failed';
    const errors = data?.errors;
    throw new ApiError(response.status, detail, errors, responseCorrelationId);
  }

  return { data: data as T, correlationId: responseCorrelationId };
}

export async function getPlans() {
  return request<Plan[]>(PLANNER_URL, '/api/plans');
}

export async function createPlan(payload: {
  asset: string;
  startTime: string;
  endTime: string;
  priority: PlanPriority;
  notes?: string;
}) {
  return request<Plan>(PLANNER_URL, '/api/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approvePlan(planId: string) {
  return request<Plan>(PLANNER_URL, `/api/plans/${planId}/approve`, {
    method: 'POST',
  });
}

export async function getTasks() {
  return request<Task[]>(OPS_URL, '/api/tasks');
}

export async function getAuditEvents(filters?: {
  correlationId?: string;
  actor?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.correlationId) params.set('correlationId', filters.correlationId);
  if (filters?.actor) params.set('actor', filters.actor);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const query = params.toString();
  return request<AuditEvent[]>(AUDIT_URL, `/api/audit${query ? `?${query}` : ''}`);
}
