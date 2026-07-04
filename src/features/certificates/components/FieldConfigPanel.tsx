import { Trash2 } from 'lucide-react';
import type { FieldMapping, FontAlignment, TextTransform } from '../types';
import { useFonts } from '../hooks/useFonts';

interface Props {
  field: FieldMapping;
  onUpdate: (f: FieldMapping) => void;
  onDelete: () => void;
}

export const FieldConfigPanel = ({ field, onUpdate, onDelete }: Props) => {
  const { data: fonts } = useFonts();

  const handleChange = (key: keyof FieldMapping, value: any) => {
    onUpdate({ ...field, [key]: value });
  };

  const memberFields = [
    { value: 'first_name', label: 'Nombres' },
    { value: 'last_name', label: 'Apellidos' },
    { value: 'full_name', label: 'Nombre Completo' },
    { value: 'dni', label: 'Cédula / Pasaporte' },
    { value: 'baptism_date', label: 'Fecha de Bautismo' },
    { value: 'birth_date', label: 'Fecha de Nacimiento' },
    { value: 'conversion_date', label: 'Fecha de Conversión' },
    { value: 'ministry_name', label: 'Nombre de Ministerio' },
    { value: 'leadership_role', label: 'Rol de Liderazgo' },
    { value: 'current_date', label: 'Fecha de Emisión (Hoy)' },
    { value: 'custom_text', label: 'Texto Libre (Manual)' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4 dark:border-white/10">
        <h3 className="font-bold text-lg dark:text-white">Propiedades</h3>
        <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Etiqueta de Referencia</label>
          <input 
            type="text" 
            value={field.label}
            onChange={e => handleChange('label', e.target.value)}
            className="w-full dark-input p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mapeo de Datos CRM</label>
          <select 
            value={field.memberField}
            onChange={e => handleChange('memberField', e.target.value)}
            className="w-full dark-input p-2 text-sm"
          >
            {memberFields.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t dark:border-white/10">
          <label className="block text-xs font-bold text-gray-500 mb-3 uppercase">Tipografía</label>
          
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Fuente</span>
              <select 
                value={field.fontId || ''}
                onChange={e => handleChange('fontId', e.target.value || null)}
                className="w-full dark-input p-2 text-sm"
              >
                <option value="">Helvetica (Predeterminada)</option>
                {fonts?.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Tamaño (pt)</span>
                <input 
                  type="number" 
                  value={field.fontSize}
                  onChange={e => handleChange('fontSize', Number(e.target.value))}
                  className="w-full dark-input p-2 text-sm"
                  min={8} max={120}
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Color (Hex)</span>
                <input 
                  type="color" 
                  value={field.color}
                  onChange={e => handleChange('color', e.target.value)}
                  className="w-full h-[38px] p-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Alineación</span>
                <select 
                  value={field.alignment}
                  onChange={e => handleChange('alignment', e.target.value as FontAlignment)}
                  className="w-full dark-input p-2 text-sm"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
              <div className="flex-1">
                <span className="text-xs text-gray-500 block mb-1">Formato</span>
                <select 
                  value={field.transform}
                  onChange={e => handleChange('transform', e.target.value as TextTransform)}
                  className="w-full dark-input p-2 text-sm"
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">MAYÚSCULAS</option>
                  <option value="lowercase">minúsculas</option>
                  <option value="capitalize">Capitalizar</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t dark:border-white/10">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Coordenadas Precisas</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-gray-400 block mb-1">X (pt)</span>
              <input 
                type="number" 
                value={Math.round(field.x)}
                onChange={e => handleChange('x', Number(e.target.value))}
                className="w-full dark-input p-2 text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-400 block mb-1">Y (pt)</span>
              <input 
                type="number" 
                value={Math.round(field.y)}
                onChange={e => handleChange('y', Number(e.target.value))}
                className="w-full dark-input p-2 text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
