import clsx from 'clsx';

interface StatusBadgeProps {
  label: string;
  tone?: 'default' | 'success' | 'warning';
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  const toneClass =
    tone === 'success'
      ? 'bg-success/10 text-success'
      : tone === 'warning'
        ? 'bg-warning/10 text-warning'
        : 'bg-cloud/70 text-ink/70';
  return <span className={clsx('chip', toneClass)}>{label}</span>;
}
