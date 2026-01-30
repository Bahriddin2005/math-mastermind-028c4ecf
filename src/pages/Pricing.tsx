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
  Settings,
  Sparkles,
  Trophy,
  TrendingUp,
  Play,
  CheckCircle2
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
  originalMonthly?: number;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  emoji: string;
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
    gradient: 'from-slate-500 to-gray-600',
    borderColor: 'border-slate-300 dark:border-slate-700',
    emoji: '🎁',
    features: [
      'Kunlik 20 ta mashq',
      'Asosiy statistika',
      'Leaderboard raqobat',
      'Yutuqlar tizimi',
    ],
  },
  {
    id: 'pro',
    name: 'Bolajon PRO',
    description: "Bolalar uchun to'liq imkoniyatlar",
    monthlyPrice: 29900,
    yearlyPrice: 249000,
    originalMonthly: 49900,
    icon: Zap,
    gradient: 'from-emerald-500 to-green-600',
    borderColor: 'border-emerald-500/50',
    emoji: '🎮',
    popular: true,
    features: [
      "Cheksiz o'yinlar va mashqlar",
      'Global reyting va olimpiadalar',
      '50+ video darslar',
      'Maxsus badges va mukofotlar',
      "Reklama yo'q",
      '7 kun bepul sinov',
    ],
    stripeTier: 'pro',
  },
  {
    id: 'premium',
    name: 'Ustoz PRO',
    description: "O'qituvchilar va markazlar uchun",
    monthlyPrice: 99900,
    yearlyPrice: 799000,
    originalMonthly: 149900,
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/50',
    emoji: '👩‍🏫',
    features: [
      'Bolajon PRO imkoniyatlari',
      'Sinf va guruhlar boshqaruvi',
      "O'quvchilar statistikasi",
      'PDF/Excel eksport',
      'Sertifikat generatori',
      'Maxsus yordam',
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
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
          
          <div className="container px-4 py-10 sm:py-14 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <Badge className="mb-4 sm:mb-5 bg-gradient-to-r from-primary to-accent text-white border-0 px-4 py-1.5 text-sm font-bold animate-bounce" style={{ animationDuration: '2s' }}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Farzandingiz kelajagi uchun investitsiya
              </Badge>
              
              {/* Main heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
                🚀 Bir oyda{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  2x tezroq
                </span>{' '}
                hisoblash
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Premium foydalanuvchilar o'rtacha <strong className="text-foreground">25% yaxshiroq natija</strong> ko'rsatmoqda. 
                Farzandingizga bu imkoniyatni bering!
              </p>

              {/* Social proof */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium"><strong>150+</strong> aktiv obunachi</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium"><strong>4.9</strong> o'rtacha baho</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium"><strong>+38%</strong> retention</span>
                </div>
              </div>

              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-3 p-1.5 bg-secondary/50 rounded-full backdrop-blur-sm border border-border/30">
                <button
                  onClick={() => setIsYearly(false)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    !isYearly 
                      ? "bg-background shadow-md text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Oylik
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    isYearly 
                      ? "bg-background shadow-md text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Yillik
                  <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">-30%</Badge>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Subscription Status */}
            {subscription?.subscribed && (
              <div className="mb-8 p-5 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Siz hozirda {currentTier === 'premium' ? 'Ustoz PRO' : 'Bolajon PRO'} rejada obuna bo'lgansiz
                  </p>
                </div>
                {subscription.subscription_end && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Keyingi to'lov: {new Date(subscription.subscription_end).toLocaleDateString('uz-UZ')}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManageSubscription}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Obunani boshqarish
                </Button>
              </div>
            )}

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12">
              {pricingPlans.map((plan, index) => {
                const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                const Icon = plan.icon;
                const isCurrentPlan = plan.id === currentTier;
                const savings = plan.originalMonthly ? Math.round((1 - plan.monthlyPrice / plan.originalMonthly) * 100) : 0;

                return (
                  <Card 
                    key={plan.id}
                    className={cn(
                      "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group",
                      plan.borderColor,
                      plan.popular && "md:scale-105 z-10 shadow-xl",
                      isCurrentPlan && "ring-2 ring-emerald-500"
                    )}
                  >
                    {/* Background gradient */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
                      plan.gradient
                    )} />

                    {/* Popular/Current badge */}
                    {(plan.popular || isCurrentPlan) && (
                      <div className="absolute top-0 left-0 right-0 flex justify-between">
                        {plan.popular && !isCurrentPlan && (
                          <div className={cn(
                            "bg-gradient-to-r text-white text-xs font-bold px-4 py-1.5 rounded-br-xl flex items-center gap-1",
                            plan.gradient
                          )}>
                            <Star className="w-3 h-3 fill-current" />
                            Eng mashhur
                          </div>
                        )}
                        {isCurrentPlan && (
                          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-br-xl flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Joriy reja
                          </div>
                        )}
                        {savings > 0 && !isCurrentPlan && (
                          <div className="bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl ml-auto">
                            -{savings}% tejash
                          </div>
                        )}
                      </div>
                    )}

                    {/* Non-popular savings badge */}
                    {savings > 0 && !plan.popular && !isCurrentPlan && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-r from-rose-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl">
                          -{savings}% tejash
                        </div>
                      </div>
                    )}

                    <CardHeader className="relative pt-10 sm:pt-12 pb-4 text-center">
                      {/* Icon */}
                      <div className={cn(
                        "w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform",
                        plan.gradient
                      )}>
                        {plan.emoji}
                      </div>
                      
                      <CardTitle className="text-xl sm:text-2xl font-bold">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="relative text-center pb-4">
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={cn(
                            "text-3xl sm:text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                            plan.gradient
                          )}>
                            {price === 0 ? 'Bepul' : formatPrice(price).replace(" so'm", '')}
                          </span>
                          {price > 0 && (
                            <span className="text-sm text-muted-foreground">so'm/{isYearly ? 'yil' : 'oy'}</span>
                          )}
                        </div>
                        {plan.originalMonthly && !isYearly && (
                          <p className="text-sm text-muted-foreground line-through mt-1">
                            {formatPrice(plan.originalMonthly)}
                          </p>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 text-left mb-6">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start gap-2.5">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                              plan.id === 'free' 
                                ? "bg-secondary" 
                                : `bg-gradient-to-r ${plan.gradient}`
                            )}>
                              <Check className={cn(
                                "h-3 w-3",
                                plan.id === 'free' ? "text-muted-foreground" : "text-white"
                              )} />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="relative px-5 pb-6">
                      <Button 
                        className={cn(
                          "w-full h-12 text-base font-bold transition-all",
                          plan.id === 'free' 
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                            : `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90 hover:scale-[1.02] shadow-lg`
                        )}
                        onClick={() => handleSubscribe(plan)}
                        disabled={loadingPlan === plan.id || isCurrentPlan}
                      >
                        {loadingPlan === plan.id ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : plan.popular ? (
                          <Rocket className="h-5 w-5 mr-2" />
                        ) : plan.id === 'premium' ? (
                          <Crown className="h-5 w-5 mr-2" />
                        ) : null}
                        {isCurrentPlan ? 'Joriy reja' : plan.id === 'free' ? 'Hozirgi reja' : "Obuna bo'lish"}
                      </Button>
                      
                      {plan.stripeTier && (
                        <p className="text-[11px] text-center text-muted-foreground mt-3 w-full">
                          ✓ 7 kun bepul sinov • Istalgan vaqt bekor qilish
                        </p>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Why Premium Section */}
            <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 rounded-3xl p-6 sm:p-10 border border-border/30 mb-12">
              <div className="text-center mb-8">
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
                  <Trophy className="w-3 h-3 mr-1" />
                  Nima uchun Premium?
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
                  Farzandingiz natijasini <span className="text-primary">2x</span> oshiring
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Premium foydalanuvchilar o'rtacha 2 barobar tezroq rivojlanmoqda
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { icon: Play, title: "Cheksiz mashq", desc: "Kunlik limitlarsiz", color: "from-emerald-500 to-green-600" },
                  { icon: Trophy, title: "Olimpiadalar", desc: "Global raqobat", color: "from-amber-500 to-orange-600" },
                  { icon: BarChart3, title: "Kengaytirilgan statistika", desc: "Chuqur tahlil", color: "from-blue-500 to-cyan-600" },
                  { icon: Users, title: "Jamoa rejasi", desc: "Oila yoki sinf", color: "from-purple-500 to-pink-600" },
                ].map((item, index) => (
                  <div 
                    key={item.title} 
                    className="text-center p-4 sm:p-5 rounded-2xl bg-background/50 border border-border/30 hover:shadow-lg transition-all group"
                  >
                    <div className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform",
                      item.color
                    )}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Section */}
            <div className="text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-4 sm:gap-8 p-4 sm:p-6 rounded-2xl bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">Xavfsiz to'lov</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">7 kun bepul sinov</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">Istalgan vaqt bekor qilish</span>
                </div>
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
