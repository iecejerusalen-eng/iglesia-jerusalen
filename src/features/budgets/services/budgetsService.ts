import { supabase } from '../../../config/supabase';
import type { BudgetItem, BudgetProposal, ContentBlock, MaintenanceRequest } from '../types';

type BudgetPayload = Omit<BudgetProposal, 'id' | 'created_at' | 'updated_at' | 'requested_by' | 'approved_by' | 'approved_at' | 'church_budget_items'> & { items: BudgetItem[] };
type RepairPayload = Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'resolved_at'>;

const normaliseBudget = (row: BudgetProposal): BudgetProposal => ({
  ...row,
  blocks: Array.isArray(row.blocks) ? row.blocks : [],
  church_budget_items: Array.isArray(row.church_budget_items) ? row.church_budget_items : [],
});

export async function listBudgets(): Promise<BudgetProposal[]> {
  const { data, error } = await supabase.from('church_budget_proposals').select('*, church_budget_items(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as BudgetProposal[]).map(normaliseBudget);
}

export async function listRepairs(): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase.from('church_maintenance_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as MaintenanceRequest[]).map((row) => ({ ...row, evidence_urls: Array.isArray(row.evidence_urls) ? row.evidence_urls : [], blocks: Array.isArray(row.blocks) ? row.blocks : [] }));
}

export async function saveBudget(payload: BudgetPayload, existingId?: string): Promise<void> {
  const { items, ...proposal } = payload;
  const { data, error } = existingId
    ? await supabase.from('church_budget_proposals').update(proposal).eq('id', existingId).select('id').single()
    : await supabase.from('church_budget_proposals').insert(proposal).select('id').single();
  if (error) throw error;
  const proposalId = existingId ?? (data as { id: string }).id;
  const { error: deleteError } = await supabase.from('church_budget_items').delete().eq('proposal_id', proposalId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;
  const { error: itemsError } = await supabase.from('church_budget_items').insert(items.map((item, index) => ({ ...item, proposal_id: proposalId, sort_order: index })));
  if (itemsError) throw itemsError;
}

export async function saveRepair(payload: RepairPayload, existingId?: string): Promise<void> {
  const query = existingId
    ? supabase.from('church_maintenance_requests').update(payload).eq('id', existingId)
    : supabase.from('church_maintenance_requests').insert(payload);
  const { error } = await query;
  if (error) throw error;
}

export const newBlock = (type: ContentBlock['type']): ContentBlock => ({
  id: crypto.randomUUID(), type, title: '', content: '', url: '', label: '', caption: '', tone: 'gold', columns: [{ label: 'Opción A', value: '' }, { label: 'Opción B', value: '' }],
});
