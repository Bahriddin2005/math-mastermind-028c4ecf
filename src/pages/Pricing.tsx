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

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <Rocket className="h-3 w-3 mr-1" />
              Tariflar
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              O'zingizga mos rejani tanlang
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Mental arifmetika bo'yicha professional darajaga yeting. 
              Har bir reja sizning maqsadlaringizga mos keladi.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3">
              <Label 
                htmlFor="billing-toggle" 
                className={cn("cursor-pointer", !isYearly && "text-foreground font-medium")}
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
                className={cn("cursor-pointer", isYearly && "text-foreground font-medium")}
              >
                Yillik
                <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600">
                  -30%
                </Badge>
              </Label>
            </div>
          </div>

          {/* Subscription Status */}
          {subscription?.subscribed && (
            <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <p className="text-green-600 font-medium">
                ✓ Siz hozirda {currentTier === 'premium' ? 'Premium' : 'Pro'} rejada obuna bo'lgansiz
              </p>
              {subscription.subscription_end && (
                <p className="text-sm text-muted-foreground mt-1">
                  Keyingi to'lov: {new Date(subscription.subscription_end).toLocaleDateString('uz-UZ')}
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleManageSubscription}
              >
                <Settings className="h-4 w-4 mr-2" />
                Obunani boshqarish
              </Button>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {pricingPlans.map((plan) => {
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === currentTier;

              return (
                <Card 
                  key={plan.id}
                  className={cn(
                    "relative border-border/40 shadow-lg transition-all hover:shadow-xl h-[520px] flex flex-col",
                    plan.popular && "ring-2 ring-primary scale-105 z-10",
                    isCurrentPlan && "ring-2 ring-green-500"
                  )}
                >
                  {plan.popular && !isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Eng ommabop
                      </Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500 text-white px-4 py-1">
                        <Check className="h-3 w-3 mr-1" />
                        Joriy reja
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pt-8 flex-shrink-0">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                      plan.color
                    )}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="text-center flex-1 flex flex-col">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{formatPrice(price)}</span>
                      {price > 0 && (
                        <span className="text-muted-foreground">/{isYearly ? 'yil' : 'oy'}</span>
                      )}
                    </div>

                    <ul className="space-y-3 text-left flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="flex-shrink-0">
                    <Button 
                      className="w-full" 
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
          <div className="bg-secondary/30 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl font-display font-bold text-center mb-8">
              Barcha rejalarda mavjud
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: 'Xavfsiz', desc: "Ma'lumotlaringiz himoyalangan" },
                { icon: Clock, title: '24/7 kirish', desc: "Istalgan vaqtda mashq qiling" },
                { icon: Users, title: 'Jamoa raqobati', desc: 'Leaderboardda bahslashing' },
                { icon: BarChart3, title: 'Statistika', desc: "Rivojlanishingizni kuzating" },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default Pricing;
