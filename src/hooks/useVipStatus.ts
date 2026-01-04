import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VipStatus {
  isVip: boolean;
  expiresAt: Date | null;
  xpMultiplier: number;
}

export const useVipStatus = () => {
  const { user } = useAuth();
  const [vipStatus, setVipStatus] = useState<VipStatus>({
    isVip: false,
    expiresAt: null,
    xpMultiplier: 1
  });
  const [loading, setLoading] = useState(true);

  const checkVipStatus = useCallback(async () => {
    if (!user) {
      setVipStatus({ isVip: false, expiresAt: null, xpMultiplier: 1 });
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('vip_expires_at')
        .eq('user_id', user.id)
        .single();

      if (profile?.vip_expires_at) {
        const expiresAt = new Date(profile.vip_expires_at);
        const isVip = expiresAt > new Date();
        
        setVipStatus({
          isVip,
          expiresAt: isVip ? expiresAt : null,
          xpMultiplier: isVip ? 2 : 1
        });
      } else {
        setVipStatus({ isVip: false, expiresAt: null, xpMultiplier: 1 });
      }
    } catch (error) {
      console.error('Error checking VIP status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const activateVip = async (durationDays: number) => {
    if (!user) return false;

    try {
      const now = new Date();
      const currentExpiry = vipStatus.expiresAt && vipStatus.expiresAt > now 
        ? vipStatus.expiresAt 
        : now;
      
      const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await supabase
        .from('profiles')
        .update({ vip_expires_at: newExpiry.toISOString() })
        .eq('user_id', user.id);

      setVipStatus({
        isVip: true,
        expiresAt: newExpiry,
        xpMultiplier: 2
      });

      return true;
    } catch (error) {
      console.error('Error activating VIP:', error);
      return false;
    }
  };

  useEffect(() => {
    checkVipStatus();
  }, [checkVipStatus]);

  return {
    ...vipStatus,
    loading,
    activateVip,
    refresh: checkVipStatus
  };
};

export default useVipStatus;
