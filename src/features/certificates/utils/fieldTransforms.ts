import type { TextTransform } from '../types';

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
  memberData: Record<string, any>
): string => {
  if (!memberField) return '';

  // Casos especiales y combinaciones
  if (memberField === 'full_name') {
    const first = memberData.first_name || '';
    const last = memberData.last_name || '';
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
    return memberData.ministries?.name || '';
  }

  // Campo libre
  if (memberField.startsWith('custom_')) {
    return memberData[memberField] || ''; // Asumimos que viene inyectado en memberData
  }

  // Fecha (formateada si existe)
  if (memberField.endsWith('_date') && memberData[memberField]) {
    try {
      const date = new Date(memberData[memberField]);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return memberData[memberField];
    }
  }

  // Fallback simple
  return memberData[memberField]?.toString() || '';
};
