import { Crown, Sparkles, Zap } from 'lucide-react';
import { useSubscription, STRIPE_TIERS } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  variant?: 'default' | 'compact' | 'inline';
  showTierName?: boolean;
  className?: string;
}

export const PremiumBadge = ({ 
  variant = 'default', 
  showTierName = true,
  className 
}: PremiumBadgeProps) => {
  const { isSubscribed, productId, loading } = useSubscription();

  if (loading || !isSubscribed) return null;

  // Determine tier name
  const getTierInfo = () => {
    if (productId === STRIPE_TIERS.ustoz_monthly.product_id || 
        productId === STRIPE_TIERS.ustoz_yearly.product_id) {
      return { name: 'Ustoz PRO', icon: Crown, color: 'from-amber-500 to-orange-500' };
    }
    if (productId === STRIPE_TIERS.bolajon_monthly.product_id || 
        productId === STRIPE_TIERS.bolajon_yearly.product_id) {
      return { name: 'Bolajon PRO', icon: Sparkles, color: 'from-emerald-500 to-green-500' };
    }
    return { name: 'PRO', icon: Zap, color: 'from-primary to-accent' };
  };

  const tierInfo = getTierInfo();
  const Icon = tierInfo.icon;

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r text-white text-[10px] font-bold shadow-sm",
        tierInfo.color,
        className
      )}>
        <Icon className="w-2.5 h-2.5" />
        {showTierName && <span>PRO</span>}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Badge className={cn(
        "bg-gradient-to-r text-white border-0 gap-1",
        tierInfo.color,
        className
      )}>
        <Icon className="w-3 h-3" />
        {showTierName && tierInfo.name}
      </Badge>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r text-white text-xs font-semibold shadow-md",
      tierInfo.color,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      {showTierName && <span>{tierInfo.name}</span>}
    </div>
  );
};
