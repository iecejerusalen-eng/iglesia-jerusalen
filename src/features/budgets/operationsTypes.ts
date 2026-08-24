export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'delegated';
export type ProcurementOrderStatus = 'requested' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
export type AssetStatus = 'active' | 'in_repair' | 'retired' | 'lost';
export type WorkOrderStatus = 'open' | 'scheduled' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface BudgetApproval {
  id: string;
  proposal_id: string;
  approver_id: string;
  step_order: number;
  status: ApprovalStatus;
  comment: string;
  decided_at: string | null;
  created_at: string;
}

export interface ProcurementOrder {
  id: string;
  proposal_id: string;
  order_number: string;
  status: ProcurementOrderStatus;
  vendor: string;
  expected_at: string | null;
  ordered_at: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChurchAsset {
  id: string;
  name: string;
  asset_type: string;
  location: string;
  brand: string;
  model: string;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_until: string | null;
  purchase_cost: number;
  currency: string;
  status: AssetStatus;
  qr_code: string | null;
  image_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  request_id: string | null;
  asset_id: string | null;
  status: WorkOrderStatus;
  assigned_to: string | null;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  labor_cost: number;
  materials_cost: number;
  currency: string;
  checklist: Array<{ label: string; done: boolean }>;
  before_urls: string[];
  after_urls: string[];
  completion_notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementActivity {
  id: string;
  proposal_id: string | null;
  request_id: string | null;
  actor_id: string | null;
  action: string;
  comment: string;
  payload: Record<string, unknown>;
  created_at: string;
}
