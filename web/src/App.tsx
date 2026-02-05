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
    const token = await createToken(selected);
    storeAuth(selected, token);
    setRole(selected);
    setTokenReady(true);
    setIsMinting(false);
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="card flex flex-col gap-6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-surface shadow-soft">
              <CloudCog className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-ink/50">GroundOps GPL</div>
              <div className="text-2xl font-semibold">Mission Operations Console</div>
              <div className="text-xs text-ink/60">Local demo mode • JWT minted in-browser</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <RoleSwitcher role={role} onSelect={handleRoleSelect} isLoading={isMinting} />
            <div className={clsx('text-xs', tokenReady ? 'text-success' : 'text-warning')}>
              {tokenReady ? 'Token ready for API calls' : 'Select a role to mint a token'}
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap items-center gap-3">
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

        <main className="pb-10">
          <Routes>
            <Route path="/" element={<PlannerPage />} />
            <Route path="/ops" element={<OpsPage />} />
            <Route path="/executive" element={<ExecutiveSummaryPage />} />
            <Route path="/audit" element={<AuditTrailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
