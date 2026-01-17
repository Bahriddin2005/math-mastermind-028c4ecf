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
    gradient: "from-emerald-500 to-teal-600",
    borderColor: "border-emerald-500/50",
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
    gradient: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/50",
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
    <div className="w-full py-8">
      {/* Section Header */}
      <div className="text-center mb-8">
        <Badge className="mb-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-bold">
          <Crown className="w-4 h-4 mr-1.5" />
          Premium rejalar
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-display font-bold mb-2">
          O'zingizga mos rejani tanlang
        </h2>
        <p className="text-muted-foreground">
          Premium a'zolik bilan barcha imkoniyatlarni oching
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative overflow-hidden border-2 ${plan.borderColor} hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
            onClick={() => navigate('/pricing')}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Mashhur
                </div>
              </div>
            )}

            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`} />

            <CardHeader className="relative pb-2">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-3xl shadow-lg`}>
                  {plan.emoji}
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">Premium a'zolik</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-4">
              {/* Features list */}
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-sm font-medium">{feature.text}</span>
                    <Check className={`ml-auto w-5 h-5 text-green-500`} />
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button 
                className={`w-full bg-gradient-to-r ${plan.gradient} text-white font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/pricing');
                }}
              >
                <Crown className="mr-2 h-4 w-4" />
                Obuna bo'lish
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom link */}
      <div className="text-center mt-6">
        <Button 
          variant="link" 
          className="text-muted-foreground hover:text-primary"
          onClick={() => navigate('/pricing')}
        >
          Barcha tariflarni ko'rish →
        </Button>
      </div>
    </div>
  );
};
