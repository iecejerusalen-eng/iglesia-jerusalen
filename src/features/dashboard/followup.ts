export interface Followup { id: string; assigned_to: string | null; followup_stage: string; followup_due_at: string | null; followup_notes: string; followup_revision: number }
export const followupLabels: Record<string, string> = { new: 'Pendiente', contacted: 'Contactado', scheduled: 'Visita acordada', completed: 'Completado' };
