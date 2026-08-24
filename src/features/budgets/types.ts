export type BudgetStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'executed' | 'archived';
export type BudgetPriority = 'low' | 'medium' | 'high' | 'critical';
export type RepairStatus = 'pending' | 'quoted' | 'in_progress' | 'resolved' | 'archived';
export type RepairPriority = 'low' | 'medium' | 'high' | 'urgent';
export type BlockType = 'heading' | 'text' | 'image' | 'video' | 'link' | 'comparison' | 'callout';

export interface ContentBlock {
  id: string;
  type: BlockType;
  title?: string;
  content?: string;
  url?: string;
  label?: string;
  caption?: string;
  tone?: 'gold' | 'blue' | 'green' | 'rose';
  columns?: Array<{ label: string; value: string; highlight?: boolean }>;
}

export interface BudgetItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  vendor: string;
  image_url: string;
  comparison_label: string;
  is_recommended: boolean;
  source_url: string;
  notes: string;
  sort_order?: number;
}

export interface BudgetProposal {
  id: string;
  title: string;
  status: BudgetStatus;
  priority: BudgetPriority;
  category: string;
  summary: string;
  what_text: string;
  how_text: string;
  why_text: string;
  cover_image_url: string | null;
  blocks: ContentBlock[];
  total_estimated: number;
  currency: string;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  church_budget_items?: BudgetItem[];
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  status: RepairStatus;
  priority: RepairPriority;
  category: string;
  location: string;
  description: string;
  what_to_buy: string;
  estimated_cost: number;
  currency: string;
  vendor: string;
  evidence_urls: string[];
  blocks: ContentBlock[];
  linked_budget_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const emptyBudgetItem = (): BudgetItem => ({
  name: '', description: '', quantity: 1, unit_price: 0, currency: 'COP', vendor: '',
  image_url: '', comparison_label: '', is_recommended: false, source_url: '', notes: '',
});

export const calculateBudgetTotal = (items: BudgetItem[]) =>
  items.reduce((sum, item) => sum + Math.max(0, item.quantity) * Math.max(0, item.unit_price), 0);
