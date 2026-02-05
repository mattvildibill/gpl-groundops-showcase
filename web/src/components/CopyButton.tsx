import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface CopyButtonProps {
  text?: string | null;
  label?: string;
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
        copied ? 'border-success/50 bg-success/10 text-success' : 'border-cloud/70 bg-surface text-ink/70 hover:text-ink'
      )}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}
