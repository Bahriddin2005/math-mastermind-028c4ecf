import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Sparkles, 
  Rocket, 
  Star, 
  ArrowRight,
  PartyPopper,
  Gift,
  Crown,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#22c55e', '#10b981', '#059669', '#fbbf24', '#f59e0b']
      });
    }, 250);

    // Show content with delay
    setTimeout(() => setShowContent(true), 300);

    return () => clearInterval(confettiInterval);
  }, []);

  const features = [
    { icon: Zap, text: "Cheksiz mashqlar", color: "text-emerald-500" },
    { icon: Star, text: "Olimpiadalar", color: "text-amber-500" },
    { icon: Crown, text: "Premium badges", color: "text-purple-500" },
    { icon: Gift, text: "Maxsus mukofotlar", color: "text-rose-500" },
  ];

  return (
    <PageBackground className="min-h-screen flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className={cn(
        "max-w-lg w-full transition-all duration-700 transform",
        showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <Card className="border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-8 text-center text-white relative overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/4 translate-y-1/4" />
            </div>

            <div className="relative">
              {/* Animated checkmark */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <Badge className="mb-3 bg-white/20 text-white border-0">
                <PartyPopper className="w-3 h-3 mr-1" />
                Tabriklaymiz!
              </Badge>

              <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
                To'lov muvaffaqiyatli! 🎉
              </h1>
              <p className="text-white/80">
                Siz endi premium a'zosiz
              </p>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {/* Welcome message */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">
                Xush kelibsiz, <span className="text-emerald-500">PRO</span> a'zo! ✨
              </h2>
              <p className="text-muted-foreground text-sm">
                Endi siz barcha premium imkoniyatlardan foydalanishingiz mumkin
              </p>
            </div>

            {/* Features unlocked */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {features.map((feature, index) => (
                <div 
                  key={feature.text}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border/50 transition-all duration-500",
                    showContent ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                  style={{ transitionDelay: `${index * 100 + 500}ms` }}
                >
                  <feature.icon className={cn("w-5 h-5", feature.color)} />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Trial info */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6 text-center">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                🎁 Sizda <strong>7 kunlik bepul sinov</strong> davri bor!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Istalgan vaqt bekor qilishingiz mumkin
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold hover:opacity-90 gap-2"
                onClick={() => navigate('/dashboard')}
              >
                <Rocket className="w-5 h-5" />
                Dashboardga o'tish
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/courses')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Premium kurslarni ko'rish
              </Button>
            </div>

            {/* Support info */}
            <p className="text-center text-xs text-muted-foreground mt-6">
              Savollaringiz bo'lsa, <a href="/contact" className="text-primary hover:underline">bog'laning</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageBackground>
  );
};

export default PaymentSuccess;
