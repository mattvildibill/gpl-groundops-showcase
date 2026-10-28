import { useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { createToken, getStoredRole, getStoredToken, Role, storeAuth } from './lib/auth';
import PlannerPage from './pages/PlannerPage';
import OpsPage from './pages/OpsPage';
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage';
import AuditTrailPage from './pages/AuditTrailPage';
import { RoleSwitcher } from './components/RoleSwitcher';
import { CloudCog } from 'lucide-react';
import clsx from 'clsx';
import { DEMO_MODE, resetDemo } from './lib/api';

const navItems = [
  { label: 'Mission Planner', path: '/' },
  { label: 'Ops Tasking', path: '/ops' },
  { label: 'Executive Summary', path: '/executive' },
  { label: 'Audit Trail', path: '/audit' },
];

export default function App() {
  const [role, setRole] = useState<Role | null>(getStoredRole());
  const [tokenReady, setTokenReady] = useState(Boolean(getStoredToken()));
  const [isMinting, setIsMinting] = useState(false);
  const [authError, setAuthError] = useState('');
  const location = useLocation();
  const activeLabel = navItems.find((item) => item.path === location.pathname)?.label ?? 'Mission Planner';

  useEffect(() => {
    if (!role) {
      return;
    }
    setTokenReady(Boolean(getStoredToken()));
  }, [role]);

  const handleRoleSelect = async (selected: Role) => {
    setIsMinting(true);
    setAuthError('');
    try {
    const token = await createToken(selected);
    storeAuth(selected, token);
    setRole(selected);
    setTokenReady(true);
    } catch { setAuthError('Role selection failed. Please try again.'); }
    finally { setIsMinting(false); }
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-10">
      <a href="#main-content" className="skip-link">Skip to mission workspace</a>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="card flex flex-col gap-6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-surface shadow-soft">
              <CloudCog className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-ink/50">GroundOps GPL</div>
              <div className="text-2xl font-semibold">Mission Operations Console</div>
              <div className="text-xs text-ink/60">{DEMO_MODE ? 'Interactive mission-ops study' : 'Local service mode • development roles'}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <RoleSwitcher role={role} onSelect={handleRoleSelect} isLoading={isMinting} />
            <div className={clsx('text-xs', tokenReady ? 'text-success' : 'text-warning')}>
              {DEMO_MODE ? 'Role permissions simulated in this browser' : tokenReady ? 'Local development token ready' : 'Select a role to connect'}
            </div>
          </div>
        </header>

        {authError && <p role="alert" className="text-warning">{authError}</p>}
        <section className="briefing" aria-label="About this showcase">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="section-title">{DEMO_MODE ? 'Synthetic scenario / browser simulation' : 'Local demonstration / Java + JMS'}</p>
            {DEMO_MODE && <button className="text-sm underline underline-offset-4" onClick={() => { resetDemo(); storeAuth('PLANNER', 'browser-simulation'); window.location.assign('/'); }}>Reset scenario</button>}
          </div>
          <p className="mt-2 text-sm">{DEMO_MODE ? 'Fictional coastal survey. Browser memory only; Java and Artemis run locally with Docker, not on this site.' : 'Local Java + Artemis stack. Fictional records and development tokens.'}</p>
          <details className="mt-2 text-xs text-ink/70"><summary className="cursor-pointer">Implementation and evidence</summary>
            <p className="mt-2">Plan → approve → wait for Ops → recover → inspect the ticket. The hosted controls simulate a paused consumer; they do not operate a live broker. Roles demonstrate permissions, not authentication.</p>
            <a className="mt-2 inline-block underline" href="https://github.com/mattvildibill/gpl-groundops-showcase/blob/main/docs/handoff-recovery.md" target="_blank" rel="noreferrer">Java test evidence and local reproduction</a>
          </details>
        </section>
        <nav aria-label="Mission workspace" className="flex flex-wrap items-center gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  isActive
                    ? 'bg-ink text-surface shadow-soft'
                    : 'bg-surface/70 text-ink/70 hover:bg-surface'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="ml-auto hidden text-xs text-ink/50 lg:block">
            Active view: {activeLabel}
          </div>
        </nav>

        <main id="main-content" className="pb-10" tabIndex={-1}>
          <Routes key={role}>
            <Route path="/" element={<PlannerPage />} />
            <Route path="/ops" element={<OpsPage />} />
            <Route path="/executive" element={<ExecutiveSummaryPage />} />
            <Route path="/audit" element={<AuditTrailPage />} />
          <Route path="*" element={<p className="card p-6">View not found. Choose a workspace above.</p>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
