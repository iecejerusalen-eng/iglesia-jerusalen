interface LiveQuizSettingSwitchProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  tone?: 'light' | 'dark';
}
export function LiveQuizSettingSwitch({ id, title, description, checked, onChange, tone = 'light' }: LiveQuizSettingSwitchProps) {
  const cardTone = tone === 'dark'
    ? 'border-white/10 bg-white/5 text-blue-50'
    : 'border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100';
  const descriptionTone = tone === 'dark' ? 'text-blue-100/70' : 'text-slate-500 dark:text-slate-400';
  const trackTone = tone === 'dark' ? 'bg-blue-950' : 'bg-slate-300 dark:bg-slate-700';

  return <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-colors ${cardTone}`}>
    <input
      id={id}
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="peer sr-only"
    />
    <span aria-hidden="true" className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-amber-500 peer-checked:after:translate-x-5 peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-amber-400/50 ${trackTone}`} />
    <span>
      <strong className="block">{title}</strong>
      <span className={`mt-1 block text-xs leading-5 ${descriptionTone}`}>{description}</span>
    </span>
  </label>;
}
