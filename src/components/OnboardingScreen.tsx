import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Trophy, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingSlide {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: Calculator,
    title: "Mental Arifmetika",
    description: "Abakus yordamida tez hisoblashni o'rganing va aqliy qobiliyatingizni rivojlantiring",
    gradient: "from-primary/20 to-primary/5",
    iconBg: "bg-primary"
  },
  {
    icon: BookOpen,
    title: "Interaktiv Darslar",
    description: "Professional o'qituvchilardan video darslar va bosqichma-bosqich o'rganish",
    gradient: "from-blue-500/20 to-blue-500/5",
    iconBg: "bg-blue-500"
  },
  {
    icon: Trophy,
    title: "Haftalik Musobaqalar",
    description: "Boshqa foydalanuvchilar bilan bellashing va reytingda o'z o'rningizni ko'ring",
    gradient: "from-yellow-500/20 to-yellow-500/5",
    iconBg: "bg-yellow-500"
  },
  {
    icon: Sparkles,
    title: "Shaxsiy Progress",
    description: "Kunlik maqsadlar, statistika va yutuqlar bilan o'z rivojlanishingizni kuzating",
    gradient: "from-accent/20 to-accent/5",
    iconBg: "bg-accent"
  }
];

const ONBOARDING_KEY = 'iqromax_onboarding_completed';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsLoading(false);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, isLoading, completeOnboarding, resetOnboarding };
};

export const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    completeOnboarding();
    navigate('/auth');
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/');
  };

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col safe-top safe-bottom">
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          O'tkazib yuborish
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Slide content with animation */}
        <div 
          key={currentSlide}
          className="flex flex-col items-center text-center animate-fade-in"
        >
          {/* Icon with gradient background */}
          <div className={cn(
            "relative mb-8",
            `bg-gradient-to-br ${slide.gradient} rounded-full p-8`
          )}>
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center",
              slide.iconBg
            )}>
              <slide.icon className="w-10 h-10 text-white" />
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/30 animate-pulse" />
            <div className="absolute -bottom-1 -left-3 w-6 h-6 rounded-full bg-accent/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {slide.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-sm leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-6 pb-8 space-y-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide 
                  ? "w-8 bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrev}
              className="flex-1 h-14 text-base"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Orqaga
            </Button>
          )}
          
          <Button
            size="lg"
            onClick={handleNext}
            className={cn(
              "h-14 text-base font-semibold",
              currentSlide === 0 ? "flex-1" : "flex-[2]"
            )}
          >
            {isLast ? (
              <>
                Boshlash
                <Sparkles className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Keyingisi
                <ChevronRight className="w-5 h-5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Login link on last slide */}
        {isLast && (
          <p className="text-center text-sm text-muted-foreground">
            Allaqachon akkountingiz bormi?{' '}
            <button 
              onClick={() => { completeOnboarding(); navigate('/auth'); }}
              className="text-primary font-medium hover:underline"
            >
              Kirish
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
