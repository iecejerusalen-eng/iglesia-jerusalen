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
      <div className="bg-slate-900 border border-slate-800 text-white px-3.5 py-2 rounded-xl shadow-xl text-xs font-semibold">
        <p className="font-serif font-bold text-gold mb-1">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color || '#D4AF37' }}></div>
            <span className="text-gray-300 capitalize">{item.name === 'cantidad' ? 'Cantidad' : item.name === 'miembros' ? 'Miembros' : item.name}:</span>
            <span className="font-mono font-bold text-white ml-auto">{item.value !== undefined ? (typeof item.value === 'number' && item.value > 1000 ? `$${item.value.toLocaleString()}` : item.value) : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
