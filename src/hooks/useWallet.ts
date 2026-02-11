import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_topup: number;
  total_spent: number;
  total_bonus: number;
  total_payout: number;
  is_frozen: boolean;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  tx_type: 'topup' | 'spend' | 'bonus' | 'payout' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch wallet
      const { data: walletData, error: walletErr } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletErr) throw walletErr;

      if (!walletData) {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createErr } = await supabase
          .from('wallets')
          .insert({ user_id: user.id })
          .select()
          .single();
        if (createErr) throw createErr;
        setWallet(newWallet as unknown as Wallet);
      } else {
        setWallet(walletData as unknown as Wallet);
      }

      // Fetch transactions
      const { data: txData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions((txData || []) as unknown as WalletTransaction[]);
    } catch (err) {
      console.error('Wallet fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { wallet, transactions, loading, refetch: fetchWallet };
};
