import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription, STRIPE_TIERS } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Lock, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PremiumRouteProps {
  children: ReactNode;
  requiredTier?: 'bolajon' | 'ustoz' | 'any';
  fallbackUrl?: string;
  showUpgradePrompt?: boolean;
}

export const PremiumRoute = ({ 
  children, 
  requiredTier = 'any',
  fallbackUrl = '/pricing',
  showUpgradePrompt = true
}: PremiumRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, productId, loading: subLoading } = useSubscription();
  const location = useLocation();

  // Show loading while checking auth and subscription
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has required subscription
  const hasRequiredSubscription = () => {
    if (!isSubscribed || !productId) return false;
    
    if (requiredTier === 'any') return true;
    
    if (requiredTier === 'bolajon') {
      return productId === STRIPE_TIERS.bolajon_monthly.product_id || 
             productId === STRIPE_TIERS.bolajon_yearly.product_id ||
             productId === STRIPE_TIERS.ustoz_monthly.product_id ||
             productId === STRIPE_TIERS.ustoz_yearly.product_id;
    }
    
    if (requiredTier === 'ustoz') {
      return productId === STRIPE_TIERS.ustoz_monthly.product_id ||
             productId === STRIPE_TIERS.ustoz_yearly.product_id;
    }
    
    return false;
  };

  if (!hasRequiredSubscription()) {
    if (showUpgradePrompt) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
          <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 text-center">
              {/* Lock icon with gradient */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Lock className="w-10 h-10 text-primary" />
              </div>

              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                <Crown className="w-3 h-3 mr-1" />
                Premium kontent
              </Badge>

              <h2 className="text-2xl font-display font-bold mb-2">
                Bu sahifa premium a'zolar uchun
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {requiredTier === 'ustoz' 
                  ? "Bu funksiyadan foydalanish uchun Ustoz PRO obunasi kerak"
                  : "Bu funksiyadan foydalanish uchun PRO obunasi kerak"
                }
              </p>

              {/* Features preview */}
              <div className="p-4 rounded-xl bg-secondary/50 mb-6 text-left">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Premium imkoniyatlar:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Cheksiz mashq va o'yinlar</li>
                  <li>✓ Olimpiada va musobaqalar</li>
                  <li>✓ Premium video darslar</li>
                  <li>✓ 7 kunlik bepul sinov</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-bold"
                  onClick={() => window.location.href = fallbackUrl}
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Premium bo'lish
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => window.history.back()}
                >
                  Orqaga qaytish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return <Navigate to={fallbackUrl} replace />;
  }

  return <>{children}</>;
};
