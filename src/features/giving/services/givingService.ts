import { supabase } from '../../../config/supabase';
import type { GivingFund, GivingTransaction, GivingRecurring } from '../types';

export const givingService = {
  async getActiveFunds(): Promise<GivingFund[]> {
    const { data, error } = await supabase
      .from('giving_funds')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async processDonation(donation: {
    donor_name: string;
    donor_email: string;
    amount: number;
    fund_id: string;
    cover_fees: boolean;
    is_recurring: boolean;
    frequency?: GivingRecurring['frequency'];
  }): Promise<{ success: boolean; transaction_id: string }> {
    const fee = donation.cover_fees ? Number((donation.amount * 0.029 + 0.3).toFixed(2)) : 0;
    const totalAmount = donation.amount + fee;
    const netAmount = donation.amount;

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('giving_transactions')
      .insert({
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        amount: totalAmount,
        fee_covered: fee,
        net_amount: netAmount,
        fund_id: donation.fund_id,
        payment_method: 'card',
        status: 'succeeded',
        receipt_number: receiptNumber,
      })
      .select()
      .single();

    if (error) throw error;

    if (donation.is_recurring) {
      await supabase.from('giving_recurring').insert({
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        amount: donation.amount,
        fund_id: donation.fund_id,
        frequency: donation.frequency || 'monthly',
        status: 'active',
      });
    }

    return { success: true, transaction_id: data.id };
  },

  async getUserTransactions(donorEmail: string): Promise<GivingTransaction[]> {
    const { data, error } = await supabase
      .from('giving_transactions')
      .select('*')
      .eq('donor_email', donorEmail)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
};
