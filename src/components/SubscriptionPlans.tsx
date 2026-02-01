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
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'teacher-pro',
    name: "Ustoz PRO",
    emoji: "👩‍🏫",
    gradient: "from-amber-500 to-yellow-500",
    borderColor: "border-amber-500/50",
    features: [
      { text: "Kurs yaratish", icon: "📚" },
      { text: "O'quvchilar statistikasi", icon: "📊" },
      { text: "Bonus va cashback", icon: "🎁" },
      { text: "Sertifikatlar", icon: "📜" },
    ],
    popular: false,
  },
  {
    id: 'kids-pro',
    name: "Bolajon PRO",
    emoji: "👶",
    gradient: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/50",
    features: [
      { text: "Barcha o'yinlar", icon: "🎮" },
      { text: "Olimpiadalar", icon: "🏆" },
      { text: "Yutuqlar", icon: "🏅" },
      { text: "Reytinglar", icon: "📈" },
    ],
    popular: true,
  },
];

export const SubscriptionPlans = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-6 sm:py-8">
      {/* Section Header */}
      <div className="text-center mb-5 sm:mb-8">
        <Badge className="mb-2 sm:mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold">
          <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
          Premium rejalar
        </Badge>
        <h2 className="text-xl xs:text-2xl sm:text-3xl font-display font-bold mb-1.5 sm:mb-2">
          O'zingizga mos rejani tanlang
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base px-4">
          Premium a'zolik bilan barcha imkoniyatlarni oching
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden border-2 ${plan.borderColor} hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer touch-target`}
            onClick={() => navigate('/pricing')}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-bl-xl flex items-center gap-0.5 sm:gap-1">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  Mashhur
                </div>
              </div>
            )}

            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`} />

            <CardHeader className="relative pb-2 p-4 sm:p-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-2xl sm:text-3xl shadow-lg`}>
                  {plan.emoji}
                </div>
                <div>
                  <CardTitle className="text-base sm:text-xl font-bold">{plan.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">Premium a'zolik</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-3 sm:space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              {/* Features list */}
              <ul className="space-y-2 sm:space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-lg sm:text-xl">{feature.icon}</span>
                    <span className="text-xs sm:text-sm font-medium flex-1">{feature.text}</span>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button 
                className={`w-full h-10 sm:h-11 bg-gradient-to-r ${plan.gradient} text-white font-bold text-sm sm:text-base hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg touch-target`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/pricing');
                }}
              >
                <Crown className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Obuna bo'lish
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom link */}
      <div className="text-center mt-4 sm:mt-6">
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
