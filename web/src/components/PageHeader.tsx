interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow && <div className="section-title">{eyebrow}</div>}
      <h1 className="text-3xl font-semibold text-ink">{title}</h1>
      <p className="text-base text-ink/70 max-w-2xl">{subtitle}</p>
    </div>
  );
}
