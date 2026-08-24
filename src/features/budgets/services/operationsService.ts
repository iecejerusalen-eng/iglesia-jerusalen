import { supabase } from '../../../config/supabase';
import type { ChurchAsset, MaintenanceWorkOrder, ProcurementActivity, ProcurementOrder } from '../operationsTypes';
import type { BudgetStatus } from '../types';

const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

export async function listOrders(): Promise<ProcurementOrder[]> {
  const { data, error } = await supabase.from('church_procurement_orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProcurementOrder[];
}

export async function listAssets(): Promise<ChurchAsset[]> {
  const { data, error } = await supabase.from('church_assets').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as unknown as ChurchAsset[];
}

export async function listWorkOrders(): Promise<MaintenanceWorkOrder[]> {
  const { data, error } = await supabase.from('church_maintenance_work_orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const typed = row as unknown as MaintenanceWorkOrder;
    return { ...typed, checklist: asArray<{ label: string; done: boolean }>(typed.checklist), before_urls: asArray<string>(typed.before_urls), after_urls: asArray<string>(typed.after_urls) };
  });
}

export async function listActivity(proposalId?: string, requestId?: string): Promise<ProcurementActivity[]> {
  let query = supabase.from('church_procurement_activity').select('*').order('created_at', { ascending: false });
  if (proposalId) query = query.eq('proposal_id', proposalId);
  if (requestId) query = query.eq('request_id', requestId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ProcurementActivity[];
}

export async function createOrder(payload: Pick<ProcurementOrder, 'proposal_id' | 'order_number' | 'vendor' | 'expected_at' | 'subtotal' | 'tax' | 'total' | 'currency' | 'notes'>): Promise<void> {
  const { error } = await supabase.from('church_procurement_orders').insert({ ...payload, status: 'requested' });
  if (error) throw error;
}

export async function createAsset(payload: Pick<ChurchAsset, 'name' | 'asset_type' | 'location' | 'brand' | 'model' | 'serial_number' | 'purchase_date' | 'warranty_until' | 'purchase_cost' | 'currency' | 'image_url'>): Promise<void> {
  const { error } = await supabase.from('church_assets').insert({ ...payload, status: 'active', metadata: {} });
  if (error) throw error;
}

export async function createWorkOrder(payload: Pick<MaintenanceWorkOrder, 'request_id' | 'asset_id' | 'assigned_to' | 'scheduled_for' | 'currency'>): Promise<void> {
  const { error } = await supabase.from('church_maintenance_work_orders').insert({ ...payload, status: 'open', checklist: [], before_urls: [], after_urls: [], labor_cost: 0, materials_cost: 0, completion_notes: '' });
  if (error) throw error;
}

export async function addActivity(payload: Pick<ProcurementActivity, 'proposal_id' | 'request_id' | 'action' | 'comment' | 'payload'>): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { error } = await supabase.from('church_procurement_activity').insert({ ...payload, actor_id: userData.user?.id ?? null });
  if (error) throw error;
}

export async function updateProposalWorkflow(proposalId: string, status: BudgetStatus, comment = ''): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const { error } = await supabase.from('church_budget_proposals').update({ status }).eq('id', proposalId);
  if (error) throw error;
  const actorId = userData.user?.id ?? null;
  if (actorId && (status === 'approved' || status === 'rejected')) {
    const { error: approvalError } = await supabase.from('church_budget_approvals').insert({ proposal_id: proposalId, approver_id: actorId, status, comment, decided_at: new Date().toISOString(), step_order: 1 });
    if (approvalError) throw approvalError;
  }
  await addActivity({ proposal_id: proposalId, request_id: null, action: `proposal_${status}`, comment, payload: { status } });
}
