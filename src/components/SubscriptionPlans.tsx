import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, Crown, Star, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';

interface PlanFeature {
  text: string;
  icon: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  borderColor: string;
  features: PlanFeature[];
  price: number;
  originalPrice?: number;
  period: string;
  popular?: boolean;
  savings?: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'kids-pro',
    name: "Bolajon PRO",
    emoji: "🎮",
    gradient: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/50",
    price: 29900,
    originalPrice: 49900,
    period: "oyiga",
    savings: "40% tejash",
    features: [
      { text: "Cheksiz o'yinlar va mashqlar", icon: "🎮" },
      { text: "Global reyting va olimpiadalar", icon: "🏆" },
      { text: "50+ video darslar", icon: "📹" },
      { text: "Maxsus badges va mukofotlar", icon: "🎖️" },
    ],
    popular: true,
  },
  {
    id: 'teacher-pro',
    name: "Ustoz PRO",
    emoji: "👩‍🏫",
    gradient: "from-amber-500 to-yellow-500",
    borderColor: "border-amber-500/50",
    price: 99900,
    originalPrice: 149900,
    period: "oyiga",
    savings: "33% tejash",
    features: [
      { text: "Sinf va guruhlar boshqaruvi", icon: "👥" },
      { text: "O'quvchilar statistikasi", icon: "📊" },
      { text: "PDF/Excel eksport", icon: "📁" },
      { text: "Sertifikat generatori", icon: "📜" },
    ],
    popular: false,
  },
];

// Format price in UZS
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('uz-UZ').format(price);
};

export const SubscriptionPlans = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-6 sm:py-8">
      {/* Motivation Section */}
      <div className="text-center mb-6 sm:mb-8 px-2">
        <Badge className="mb-3 sm:mb-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold animate-pulse">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
          Farzandingiz kelajagi uchun investitsiya
        </Badge>
        
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-display font-bold mb-2 sm:mb-3">
          🚀 Bir oyda <span className="text-primary">2x tezroq</span> hisoblash
        </h2>
        
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto mb-4">
          Premium foydalanuvchilar o'rtacha <strong className="text-foreground">25% yaxshiroq natija</strong> ko'rsatmoqda. 
          Farzandingizga bu imkoniyatni bering!
        </p>

        {/* Social proof mini stats */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span><strong className="text-foreground">150+</strong> aktiv obunachi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span><strong className="text-foreground">4.9</strong> baho</span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden border-2 ${plan.borderColor} hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer touch-target ${plan.popular ? 'ring-2 ring-primary/30' : ''}`}
            onClick={() => navigate('/pricing')}
          >
            {/* Popular badge + Savings */}
            {plan.popular && (
              <div className="absolute top-0 left-0 right-0 flex justify-between">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-br-xl flex items-center gap-0.5 sm:gap-1">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                  Eng mashhur
                </div>
                {plan.savings && (
                  <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-bl-xl">
                    {plan.savings}
                  </div>
                )}
              </div>
            )}
            
            {!plan.popular && plan.savings && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-bl-xl">
                  {plan.savings}
                </div>
              </div>
            )}

            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`} />

            <CardHeader className="relative pb-2 p-4 sm:p-6 pt-8 sm:pt-10">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg`}>
                  {plan.emoji}
                </div>
                <div>
                  <CardTitle className="text-base sm:text-xl font-bold">{plan.name}</CardTitle>
                  {/* Price display */}
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl sm:text-2xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">so'm/{plan.period}</span>
                  </div>
                  {plan.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(plan.originalPrice)} so'm
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              {/* Features list */}
              <ul className="space-y-2 sm:space-y-2.5">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">{feature.icon}</span>
                    <span className="text-xs sm:text-sm font-medium flex-1">{feature.text}</span>
                    <Check className="w-4 h-4 text-green-500" />
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button 
                className={`w-full h-11 sm:h-12 bg-gradient-to-r ${plan.gradient} text-white font-bold text-sm sm:text-base hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg touch-target`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/pricing');
                }}
              >
                <Crown className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Obuna bo'lish
              </Button>

              {/* Trust indicator */}
              <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
                ✓ 7 kun bepul sinov • Istalgan vaqt bekor qilish
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom motivational note */}
      <div className="text-center mt-5 sm:mt-6 space-y-2">
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2">
          <span className="text-lg">💡</span>
          <span>Har kuni <strong className="text-foreground">10 daqiqa</strong> mashq = <strong className="text-primary">1 oyda 2x tezlik</strong></span>
        </p>
        <Button 
          variant="link" 
          className="text-muted-foreground hover:text-primary text-sm"
          onClick={() => navigate('/pricing')}
        >
          Barcha tariflarni ko'rish →
        </Button>
      </div>
    </div>
  );
};
