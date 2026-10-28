import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DemoRoleContext } from './DemoRoleContext';

export function EvidenceLink({ trace, children }: { trace?: string | null; children: React.ReactNode }) {
  const selectDemoRole = useContext(DemoRoleContext);
  return <Link className="text-sm underline" to={`/audit?correlationId=${encodeURIComponent(trace ?? '')}`}
    onClick={() => { if (selectDemoRole) void selectDemoRole('AUDITOR'); }}>{children}</Link>;
}
