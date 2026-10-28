import { useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { createToken, getStoredRole, getStoredToken, Role, storeAuth } from './lib/auth';
import { DemoRoleContext } from './components/DemoRoleContext';
import PlannerPage from './pages/PlannerPage';
import OpsPage from './pages/OpsPage';
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage';
import AuditTrailPage from './pages/AuditTrailPage';
import { RoleSwitcher } from './components/RoleSwitcher';
import { CloudCog } from 'lucide-react';
import clsx from 'clsx';
import { DEMO_MODE, resetDemo } from './lib/api';

const navItems = [
  { label: 'Mission workspace', path: '/', role: 'PLANNER' as Role },
  { label: 'Operations tickets', path: '/ops', role: 'OPS' as Role },
  { label: 'Overview', path: '/executive', role: 'EXEC' as Role },
  { label: 'History & evidence', path: '/audit', role: 'AUDITOR' as Role },
];

export default function App() {
  const location = useLocation();
  const [role, setRole] = useState<Role | null>(() => {
    if (!DEMO_MODE) return getStoredRole();
    const initial = navItems.find(item => item.path === window.location.pathname)?.role ?? 'PLANNER';
    storeAuth(initial, 'browser-simulation');
    return initial;
  });
  const [tokenReady, setTokenReady] = useState(Boolean(getStoredToken()));
  const [isMinting, setIsMinting] = useState(false);
  const [authError, setAuthError] = useState('');


  useEffect(() => {
    if (!role) {
      return;
    }
    setTokenReady(Boolean(getStoredToken()));
  }, [role]);

  const handleRoleSelect = async (selected: Role) => {
    if (DEMO_MODE) { storeAuth(selected, 'browser-simulation'); setRole(selected); setTokenReady(true); return; }
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

  // Route entry includes browser history and direct links. Manual overrides on
  // the current route remain available; local Java mode never changes persona.
  useLayoutEffect(() => {
    if (DEMO_MODE) {
      const routeRole = navItems.find(item => item.path === location.pathname)?.role;
      if (routeRole) { storeAuth(routeRole, 'browser-simulation'); setRole(routeRole); }
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen px-4 py-4 lg:px-8">
      <a href="#main-content" className="skip-link">Skip to mission workspace</a>
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="workspace-header">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3"><CloudCog className="h-6 w-6 text-accentStrong" /><span className="text-xl font-semibold">GroundOps</span><span className="mode-label">{DEMO_MODE ? 'Browser simulation' : 'Local Java + JMS'}</span></div>
            <div className="flex items-center gap-4 text-xs text-ink/70">{DEMO_MODE && <button className="underline" onClick={() => { resetDemo(); storeAuth('PLANNER', 'browser-simulation'); window.location.assign('/'); }}>Reset scenario</button>}</div>
          </div>
          <details className="mt-2 text-sm text-ink/70"><summary className="cursor-pointer w-fit">How it works & technical controls</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div><p>{DEMO_MODE ? 'A fictional satellite imaging request, simulated in browser memory. Java services and Artemis run locally with Docker, not here. Refresh clears the exercise.' : 'The local Docker stack runs Java services and Artemis. Fictional data and development tokens only.'}</p><a className="mt-2 inline-block underline" href="https://github.com/mattvildibill/gpl-groundops-showcase/blob/main/docs/handoff-recovery.md" target="_blank" rel="noreferrer">Architecture, Java tests & local reproduction</a></div>
              <div><p className="mb-2 text-xs font-semibold">Explore service permissions (technical)</p><RoleSwitcher role={role} onSelect={handleRoleSelect} isLoading={isMinting} /><p className="mt-2 text-xs">{DEMO_MODE ? 'Navigation selects the matching demo role. Override it here to explore permission checks; this is not authentication.' : tokenReady ? 'Local development token ready.' : 'Select a role to connect.'}</p></div>
            </div>
          </details>
        </header>
        {authError && <p role="alert" className="text-warning">{authError}</p>}
        <nav aria-label="Mission workspace" className="workspace-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (DEMO_MODE) void handleRoleSelect(item.role); }}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition',
                  isActive
                    ? 'bg-ink text-surface shadow-soft'
                    : 'bg-surface/70 text-ink/70 hover:bg-surface'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main id="main-content" className="pb-10" tabIndex={-1}>
          <DemoRoleContext.Provider value={DEMO_MODE ? handleRoleSelect : null}>
          <Routes key={role}>
            <Route path="/" element={<PlannerPage />} />
            <Route path="/ops" element={<OpsPage />} />
            <Route path="/executive" element={<ExecutiveSummaryPage />} />
            <Route path="/audit" element={<AuditTrailPage />} />
          <Route path="*" element={<p className="card p-6">View not found. Choose a workspace above.</p>} />
          </Routes>
          </DemoRoleContext.Provider>
        </main>
      </div>
    </div>
  );
}
