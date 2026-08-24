export interface GivingFund {
  id: string;
  name: string;
  description?: string;
  goal_amount?: number;
  current_amount: number;
  is_active: boolean;
  is_default: boolean;
}

export interface GivingTransaction {
  id: string;
  donor_id?: string;
  donor_email: string;
  donor_name: string;
  amount: number;
  fee_covered: number;
  net_amount: number;
  fund_id?: string;
  payment_method: 'card' | 'bank_transfer' | 'apple_pay' | 'google_pay';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_intent?: string;
  recurring_id?: string;
  receipt_number?: string;
  created_at: string;
}

export interface GivingRecurring {
  id: string;
  donor_id?: string;
  donor_email: string;
  donor_name: string;
  amount: number;
  fund_id?: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'annual';
  status: 'active' | 'paused' | 'cancelled';
  next_payment_date?: string;
  created_at: string;
}

export interface GivingReceipt {
  id: string;
  transaction_id?: string;
  donor_id: string;
  receipt_url?: string;
  year: number;
  total_amount: number;
  generated_at: string;
}
