import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SubscriptionContextType {
  isSubscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  isDemoMode: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Demo mode - barcha premium funksiyalar bepul
// Keyinchalik Payme/Click/Visa/Mastercard integratsiyasi uchun false qiling
export const DEMO_MODE = true;

// Stripe product and price IDs (keyinchalik Payme/Click bilan almashtiriladi)
export const STRIPE_TIERS = {
  bolajon_monthly: {
    price_id: 'price_1SvL3tHENpONntho4DeqNDrP',
    product_id: 'prod_Tt7IfbuvpX61Sz',
    name: 'Bolajon PRO',
    interval: 'month',
  },
  bolajon_yearly: {
    price_id: 'price_1SvL4GHENpONnthoQHj3buGT',
    product_id: 'prod_Tt7ICzwsfnWMzo',
    name: 'Bolajon PRO Yillik',
    interval: 'year',
  },
  ustoz_monthly: {
    price_id: 'price_1SvL58HENpONntho0ARLwGdq',
    product_id: 'prod_Tt7J6SGQ9jy0Lh',
    name: 'Ustoz PRO',
    interval: 'month',
  },
  ustoz_yearly: {
    price_id: 'price_1SvL5PHENpONntho9EYsDjr3',
    product_id: 'prod_Tt7KCd7JtEyO2n',
    name: 'Ustoz PRO Yillik',
    interval: 'year',
  },
} as const;

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(DEMO_MODE);
  const [productId, setProductId] = useState<string | null>(DEMO_MODE ? 'demo_mode' : null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    // Demo rejimida har doim subscribed
    if (DEMO_MODE) {
      setIsSubscribed(true);
      setProductId('demo_mode');
      setSubscriptionEnd(null);
      return;
    }

    if (!session?.access_token) {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setIsSubscribed(data?.subscribed || false);
      setProductId(data?.product_id || null);
      setSubscriptionEnd(data?.subscription_end || null);
    } catch (err) {
      console.error('Failed to check subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (DEMO_MODE) {
      setIsSubscribed(true);
      setProductId('demo_mode');
      return;
    }

    if (user) {
      checkSubscription();
    } else {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
    }
  }, [user, checkSubscription]);

  // Auto-refresh subscription status every 60 seconds (only if not demo mode)
  useEffect(() => {
    if (DEMO_MODE || !user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed, productId, subscriptionEnd, loading, checkSubscription, isDemoMode: DEMO_MODE }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
