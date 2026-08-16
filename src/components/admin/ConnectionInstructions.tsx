import { useState } from 'react';
import { Check, Clipboard, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';

export interface ConnectionInstructionStep {
  title: string;
  description: string;
}

interface ConnectionInstructionsProps {
  eyebrow: string;
  title: string;
  description: string;
  steps: ConnectionInstructionStep[];
  command?: string;
  commandLabel?: string;
  helpUrl?: string;
  helpLabel?: string;
  note?: string;
}

const ConnectionInstructions = ({
  eyebrow,
  title,
  description,
  steps,
  command,
  commandLabel = 'Comando de configuración',
  helpUrl,
  helpLabel = 'Abrir documentación',
  note,
}: ConnectionInstructionsProps) => {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success('Instrucciones copiadas.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'El navegador no permitió copiar el texto.';
      toast.error(`No se pudo copiar: ${message}`);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-indigo-200/70 bg-indigo-50/70 p-5 dark:border-indigo-400/20 dark:bg-indigo-400/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-600 dark:text-indigo-300">{eyebrow}</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-indigo-950 dark:text-white">{title}</h3>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-indigo-900/70 dark:text-indigo-100/75">{description}</p>
        </div>
        {helpUrl && <a href={helpUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-indigo-200 bg-white/80 px-3 text-[11px] font-black text-indigo-800 transition hover:border-indigo-400 dark:border-indigo-300/20 dark:bg-slate-950/30 dark:text-indigo-100"><ExternalLink size={14} /> {helpLabel}</a>}
      </div>
      <ol className="mt-5 grid gap-3 lg:grid-cols-2">
        {steps.map((step, index) => <li key={step.title} className="flex gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 dark:border-white/10 dark:bg-slate-950/25"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-600 text-xs font-black text-white">{index + 1}</span><div><strong className="text-xs text-indigo-950 dark:text-white">{step.title}</strong><p className="mt-1 text-[11px] leading-5 text-indigo-900/70 dark:text-indigo-100/70">{step.description}</p></div></li>)}
      </ol>
      {command && <div className="mt-4 rounded-2xl border border-indigo-200 bg-slate-950 p-4 text-left shadow-inner dark:border-indigo-300/20"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[.16em] text-indigo-300">{commandLabel}</span><button type="button" onClick={() => void copyCommand()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-white/10">{copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? 'Copiado' : 'Copiar'}</button></div><pre className="max-h-52 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-slate-200">{command}</pre></div>}
      {note && <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-indigo-900/75 dark:text-indigo-100/75"><Info size={14} className="mt-0.5 shrink-0" />{note}</p>}
    </section>
  );
};

export default ConnectionInstructions;
