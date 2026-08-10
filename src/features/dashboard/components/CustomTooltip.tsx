interface CustomTooltipItem {
  color?: string;
  name?: string;
  value?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipItem[];
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-950/95 px-3.5 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl">
        {label && <p className="mb-1.5 font-bold text-blue-200">{label}</p>}
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color || '#60a5fa' }} />
            <span className="capitalize text-slate-300">{item.name === 'cantidad' ? 'Cantidad' : item.name === 'miembros' ? 'Miembros' : item.name}:</span>
            <span className="ml-auto font-mono font-bold text-white">{typeof item.value === 'number' ? item.value.toLocaleString('es-EC') : item.value ?? ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
