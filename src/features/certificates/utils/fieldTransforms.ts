import type { TextTransform } from '../types';

const asText = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export const applyTextTransform = (text: string, transform: TextTransform): string => {
  if (!text) return '';
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (c) => c.toUpperCase());
    case 'none':
    default:
      return text;
  }
};

export const resolveFieldValue = (
  memberField: string,
  memberData: Record<string, unknown>
): string => {
  if (!memberField) return '';

  // Casos especiales y combinaciones
  if (memberField === 'full_name') {
    const first = asText(memberData.first_name);
    const last = asText(memberData.last_name);
    return `${first} ${last}`.trim();
  }

  if (memberField === 'current_date') {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  if (memberField === 'ministry_name') {
    const ministries = memberData.ministries;
    return typeof ministries === 'object' && ministries !== null && 'name' in ministries ? asText(ministries.name) : '';
  }

  // Campo libre
  if (memberField.startsWith('custom_')) {
    return asText(memberData[memberField]); // Asumimos que viene inyectado en memberData
  }

  // Fecha (formateada si existe)
  const rawValue = memberData[memberField];
  if (memberField.endsWith('_date') && rawValue) {
    try {
      const date = new Date(asText(rawValue));
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return asText(rawValue);
    }
  }

  // Fallback simple
  return asText(rawValue);
};
