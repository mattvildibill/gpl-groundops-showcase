import { ShieldCheck } from 'lucide-react';
import { Role } from '../lib/auth';
import clsx from 'clsx';

interface RoleSwitcherProps {
  role: Role | null;
  onSelect: (role: Role) => void;
  isLoading?: boolean;
}

const roles: Role[] = ['PLANNER', 'OPS', 'EXEC', 'AUDITOR'];

export function RoleSwitcher({ role, onSelect, isLoading }: RoleSwitcherProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/50">
        <ShieldCheck className="h-4 w-4 text-accent" />
        Demo Role
      </div>
      <div className="flex items-center gap-2 rounded-full bg-surface/80 p-1 shadow-soft">
        {roles.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(item)}
            disabled={isLoading}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              role === item
                ? 'bg-ink text-surface'
                : 'text-ink/70 hover:bg-cloud/70',
              isLoading && role === item && 'opacity-80'
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
