import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket,
  Star,
  Gift,
  Shield,
  Clock,
  Users,
  BarChart3,
  Loader2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Stripe price and product IDs
const STRIPE_TIERS = {
  pro: {
    price_id: "price_1Sia73HENpONntho0Y4abUeU",
    product_id: "prod_TfvzOLBhYojy4e",
  },
  premium: {
    price_id: "price_1Sia7HHENpONnthoe10Kiiht",
    product_id: "prod_Tfvz8P0qtLknhc",
  }
};

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ElementType;
  color: string;
  popular?: boolean;
  features: string[];
  stripeTier?: keyof typeof STRIPE_TIERS;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Bepul',
    description: "Boshlang'ich foydalanuvchilar uchun",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Gift,
    color: 'bg-secondary text-secondary-foreground',
    features: [
      'Kunlik 20 ta mashq',
      'Asosiy statistika',
      'Leaderboard raqobat',
      'Yutuqlar tizimi',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: "Faol o'rganuvchilar uchun",
    monthlyPrice: 29000,
    yearlyPrice: 249000,
    icon: Zap,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    popular: true,
    features: [
      'Cheksiz mashqlar',
      "Kengaytirilgan statistika",
      "Shaxsiy o'quv rejasi",
      "Reklama yo'q",
      'Priority yordam',
      'Maxsus yutuqlar',
    ],
    stripeTier: 'pro',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Professional darajaga yetish uchun',
    monthlyPrice: 49000,
    yearlyPrice: 399000,
    icon: Crown,
    color: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
    features: [
      'Pro rejadagi barcha imkoniyatlar',
      'Shaxsiy mentor yordam',
      'Video darslar',
      'Sertifikat olish',
      'Oilaviy paket (3 akkaunt)',
      'Beta funksiyalarga kirish',
    ],
    stripeTier: 'premium',
  },
];

const Pricing = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  useEffect(() => {
    // Check URL params for success/cancel
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Obuna muvaffaqiyatli amalga oshirildi!", {
        description: "Premium imkoniyatlardan foydalanishingiz mumkin.",
      });
      // Clear URL params
      window.history.replaceState({}, '', '/pricing');
    } else if (params.get('canceled') === 'true') {
      toast.info("To'lov bekor qilindi");
      window.history.replaceState({}, '', '/pricing');
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    setCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Bepul';
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
  };

  const getCurrentTier = () => {
    if (!subscription?.subscribed || !subscription.product_id) return 'free';
    if (subscription.product_id === STRIPE_TIERS.premium.product_id) return 'premium';
    if (subscription.product_id === STRIPE_TIERS.pro.product_id) return 'pro';
    return 'free';
  };

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      toast.info("Avval tizimga kiring", {
        description: "Obuna bo'lish uchun ro'yxatdan o'ting yoki tizimga kiring.",
        action: {
          label: "Kirish",
          onClick: () => navigate('/auth'),
        },
      });
      return;
    }

    if (plan.id === 'free') {
      toast.success("Siz allaqachon bepul rejada foydalanmoqdasiz!");
      return;
    }

    if (!plan.stripeTier) return;

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: STRIPE_TIERS[plan.stripeTier].price_id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error("Xatolik yuz berdi", {
        description: "Iltimos, qaytadan urinib ko'ring.",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const currentTier = getCurrentTier();

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section with gradient - Dark mode optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/15 dark:via-background dark:to-accent/15">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-primary/20 dark:from-primary/30 to-primary/5 dark:to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tr from-accent/20 dark:from-accent/30 to-accent/5 dark:to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>
          
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="container px-4 py-8 sm:py-10 md:py-14 relative">
            <div className="max-w-6xl mx-auto text-center">
              <Badge className="mb-4 sm:mb-6 bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 dark:border-primary/30">
                <Rocket className="h-3 w-3 mr-1" />
                Tariflar
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
                O'zingizga mos rejani tanlang
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                Mental arifmetika bo'yicha professional darajaga yeting. 
                Har bir reja sizning maqsadlaringizga mos keladi.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 p-2 bg-secondary/50 dark:bg-secondary/30 rounded-full inline-flex backdrop-blur-sm border border-border/30">
                <Label 
                  htmlFor="billing-toggle" 
                  className={cn("cursor-pointer px-3 py-1.5 rounded-full transition-colors text-sm", !isYearly && "bg-background dark:bg-card text-foreground font-medium shadow-sm")}
                >
                  Oylik
                </Label>
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                />
                <Label 
                  htmlFor="billing-toggle" 
                  className={cn("cursor-pointer px-3 py-1.5 rounded-full transition-colors text-sm flex items-center gap-1.5", isYearly && "bg-background dark:bg-card text-foreground font-medium shadow-sm")}
                >
                  Yillik
                  <Badge variant="secondary" className="bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] px-1.5">
                    -30%
                  </Badge>
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Subscription Status */}
            {subscription?.subscribed && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-green-500/10 dark:bg-green-500/15 border border-green-500/20 dark:border-green-500/30 rounded-xl sm:rounded-2xl text-center backdrop-blur-sm opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <p className="text-green-600 dark:text-green-400 font-medium text-sm sm:text-base">
                  ✓ Siz hozirda {currentTier === 'premium' ? 'Premium' : 'Pro'} rejada obuna bo'lgansiz
                </p>
                {subscription.subscription_end && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Keyingi to'lov: {new Date(subscription.subscription_end).toLocaleDateString('uz-UZ')}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 h-9"
                  onClick={handleManageSubscription}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Obunani boshqarish
                </Button>
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16">
              {pricingPlans.map((plan, index) => {
                const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                const Icon = plan.icon;
                const isCurrentPlan = plan.id === currentTier;

                return (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "relative border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl transition-all hover:shadow-xl dark:hover:shadow-2xl h-auto md:h-[520px] flex flex-col backdrop-blur-sm opacity-0 animate-fade-in",
                      plan.popular && "ring-2 ring-primary md:scale-105 z-10",
                      isCurrentPlan && "ring-2 ring-green-500 dark:ring-green-400"
                    )}
                    style={{ animationDelay: `${150 + index * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    {plan.popular && !isCurrentPlan && (
                      <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 sm:px-4 py-1 text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Eng ommabop
                        </Badge>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-green-500 dark:bg-green-600 text-white px-3 sm:px-4 py-1 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Joriy reja
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pt-6 sm:pt-8 flex-shrink-0">
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg",
                        plan.color
                      )}>
                        <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                      </div>
                      <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="text-center flex-1 flex flex-col px-4 sm:px-6">
                      <div className="mb-4 sm:mb-6">
                        <span className="text-3xl sm:text-4xl font-bold text-foreground">{formatPrice(price)}</span>
                        {price > 0 && (
                          <span className="text-sm sm:text-base text-muted-foreground">/{isYearly ? 'yil' : 'oy'}</span>
                        )}
                      </div>

                      <ul className="space-y-2 sm:space-y-3 text-left flex-1">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs sm:text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6">
                      <Button 
                        className="w-full h-10 sm:h-11" 
                        variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(plan)}
                        disabled={loadingPlan === plan.id || isCurrentPlan}
                      >
                        {loadingPlan === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isCurrentPlan ? 'Joriy reja' : plan.id === 'free' ? 'Hozirgi reja' : "Obuna bo'lish"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Features Section */}
            <div className="bg-secondary/30 dark:bg-secondary/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-border/30 dark:border-border/20 backdrop-blur-sm opacity-0 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-center mb-6 sm:mb-8 text-foreground">
                Barcha rejalarda mavjud
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { icon: Shield, title: 'Xavfsiz', desc: "Ma'lumotlaringiz himoyalangan" },
                  { icon: Clock, title: '24/7 kirish', desc: "Istalgan vaqtda mashq qiling" },
                  { icon: Users, title: 'Jamoa raqobati', desc: 'Leaderboardda bahslashing' },
                  { icon: BarChart3, title: 'Statistika', desc: "Rivojlanishingizni kuzating" },
                ].map((item, index) => (
                  <div key={item.title} className="text-center opacity-0 animate-fade-in" style={{ animationDelay: `${600 + index * 50}ms`, animationFillMode: 'forwards' }}>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-2 sm:mb-3 border border-primary/10 dark:border-primary/20">
                      <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base text-foreground">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default Pricing;
