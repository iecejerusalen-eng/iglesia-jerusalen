

export function getCleanBlockName(blockId: string) {
  if (!blockId) return 'General';
  return blockId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function getDimensionLabel(dim: string) {
  const map: Record<string, string> = {
    gender: 'Género',
    leadership_role: 'Rol de Liderazgo',
    age_group: 'Grupo de Edad',
    month: 'Mes',
    payment_method: 'Método de Pago',
    status: 'Estado',
    category: 'Categoría',
    block_id: 'Cuestionario',
    score_range: 'Rango de Calificación',
    artist: 'Artista',
    bpm_range: 'Rango de BPM',
    recurrence: 'Recurrencia'
  };
  return map[dim] || dim;
}
