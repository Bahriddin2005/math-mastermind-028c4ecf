import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi
} from './ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Play, 
  GraduationCap,
  BarChart3,
  Gamepad2,
  Rocket,
  Eye,
  FileText
} from 'lucide-react';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';
import heroSlideKids from '@/assets/hero-slide-kids.jpg';
import heroSlideParents from '@/assets/hero-slide-parents.jpg';
import heroSlideTeachers from '@/assets/hero-slide-teachers.jpg';

interface HeroSlide {
  id: string;
  image: string;
  gradientOverlay: string;
  badge: {
    icon: React.ElementType;
    text: string;
    bgColor: string;
    extraBadge?: string;
  };
  title: React.ReactNode;
  description: string;
  cta: {
    icon: React.ElementType;
    text: string;
    className: string;
  };
  showLogo?: boolean;
  secondaryCta?: {
    icon: React.ElementType;
    text: string;
  };
}

interface HeroCarousel3DProps {
  totalUsers: number;
}

export const HeroCarousel3D = ({ totalUsers }: HeroCarousel3DProps) => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Memoized slides - only 3 slides for performance
  const slides: HeroSlide[] = useMemo(() => [
    {
      id: 'kids',
      image: heroSlideKids,
      gradientOverlay: 'from-black/60 via-black/20 to-transparent',
      badge: {
        icon: Rocket,
        text: '#1 Mental Arifmetika',
        bgColor: 'bg-kid-yellow/90 text-gray-900',
      },
      title: (
        <>
          <span className="text-kid-yellow drop-shadow-lg">5–14</span> yoshli bolalar uchun
        </>
      ),
      description: "O'yin orqali tez hisoblashni o'rganing. XP, Level va Badges to'plang!",
      cta: {
        icon: Play,
        text: 'Bepul boshlash',
        className: 'bg-white text-primary hover:bg-white/90',
      },
      showLogo: true,
      secondaryCta: {
        icon: Gamepad2,
        text: 'Demo sinab ko\'ring',
      },
    },
    {
      id: 'parents',
      image: heroSlideParents,
      gradientOverlay: 'from-blue-900/60 via-blue-900/20 to-transparent',
      badge: {
        icon: Eye,
        text: 'Ota-onalar uchun',
        bgColor: 'bg-blue-500 text-white',
      },
      title: (
        <>
          Farzandingiz <span className="text-kid-yellow">rivojini</span> kuzating
        </>
      ),
      description: 'Real vaqtda statistika, kunlik hisobot va shaxsiy tavsiyalar oling.',
      cta: {
        icon: BarChart3,
        text: 'Kuzatuv paneli',
        className: 'bg-blue-500 text-white hover:bg-blue-600',
      },
    },
    {
      id: 'teachers',
      image: heroSlideTeachers,
      gradientOverlay: 'from-amber-900/60 via-amber-900/20 to-transparent',
      badge: {
        icon: GraduationCap,
        text: "O'qituvchilar uchun",
        bgColor: 'bg-amber-500 text-white',
        extraBadge: 'Beta',
      },
      title: (
        <>
          <span className="text-kid-yellow">Sinf natijalarini</span> oson boshqaring
        </>
      ),
      description: 'Guruh statistikasi, PDF/Excel eksport va sertifikatlar tizimi.',
      cta: {
        icon: FileText,
        text: 'Boshlash',
        className: 'bg-amber-500 text-white hover:bg-amber-600',
      },
    },
  ], []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  // Autoplay plugin with touch-friendly settings
  const autoplayPlugin = useMemo(() => 
    Autoplay({ 
      delay: 6000, 
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }), 
  []);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl animate-fade-in">
      <Carousel
        setApi={setApi}
        opts={{ 
          loop: true,
          dragFree: false,
          containScroll: 'trimSnaps',
          skipSnaps: false,
        }}
        plugins={[autoplayPlugin]}
        className="w-full touch-pan-y"
      >
        <CarouselContent className="will-change-transform">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="touch-manipulation">
              <div className="relative h-[380px] sm:h-[420px] md:h-[480px] overflow-hidden">
                {/* Image Background */}
                <img 
                  src={slide.image}
                  alt={slide.id}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ 
                    transform: current === index ? 'scale(1.02)' : 'scale(1.1)',
                    transition: 'transform 0.5s ease-out',
                  }}
                />

                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay}`} />

                {/* Content */}
                <div 
                  className={`absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 text-white transition-all duration-500 ${
                    current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                    {slide.showLogo && (
                      <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-2.5 shadow-2xl ring-2 ring-white/20">
                        <img src={iqromaxLogo} alt="IQROMAX" className="h-8 sm:h-10 w-auto" />
                      </div>
                    )}
                    <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 ${slide.badge.bgColor} rounded-full text-xs sm:text-sm font-bold shadow-xl backdrop-blur-sm ring-1 ring-white/20`}>
                      <slide.badge.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {slide.badge.text}
                    </span>
                    {slide.badge.extraBadge && (
                      <span className="px-2.5 py-1 bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900 rounded-full text-[10px] sm:text-xs font-bold shadow-lg animate-pulse">
                        ✨ {slide.badge.extraBadge}
                      </span>
                    )}
                  </div>

                  {/* Title with animated gradient text */}
                  <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-display font-black leading-[1.1] mb-3 sm:mb-4">
                    <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description with better readability */}
                  <p className="text-base sm:text-lg md:text-xl text-white/95 mb-5 sm:mb-6 max-w-2xl leading-relaxed font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {slide.description}
                  </p>

                  {/* Enhanced CTA Buttons */}
                  <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/auth')}
                      className={`gap-2.5 ${slide.cta.className} font-bold shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-300 h-12 sm:h-14 text-sm sm:text-base px-6 sm:px-8 rounded-xl ring-2 ring-white/20`}
                    >
                      <slide.cta.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      {slide.cta.text}
                    </Button>
                    {slide.showLogo && (
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/train')}
                        className="gap-2.5 bg-white/15 border-2 border-white/40 text-white hover:bg-white/25 hover:border-white/60 active:scale-95 h-12 sm:h-14 text-sm sm:text-base px-6 sm:px-8 backdrop-blur-md rounded-xl transition-all duration-300 font-semibold"
                      >
                        <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6" />
                        Demo sinab ko'ring
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Hidden on mobile, visible on tablet+ */}
        <CarouselPrevious className="hidden sm:flex left-3 bg-white/20 border-white/30 text-white hover:bg-white/40 transition-all backdrop-blur-sm" />
        <CarouselNext className="hidden sm:flex right-3 bg-white/20 border-white/30 text-white hover:bg-white/40 transition-all backdrop-blur-sm" />
      </Carousel>

      {/* Dot Indicators - Touch friendly */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 sm:gap-2 px-4 py-2.5 sm:py-2 bg-black/30 backdrop-blur-sm rounded-full">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollTo(index)}
            className={`relative transition-all duration-300 touch-target ${
              current === index 
                ? 'w-8 sm:w-8 h-2.5 sm:h-2' 
                : 'w-2.5 sm:w-2 h-2.5 sm:h-2 hover:bg-white/60 active:scale-110'
            } rounded-full overflow-hidden`}
            aria-label={`Slayd ${index + 1}`}
          >
            <span 
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                current === index ? 'bg-white' : 'bg-white/40'
              }`}
            />
            {current === index && (
              <span 
                className="absolute inset-0 bg-kid-yellow rounded-full origin-left"
                style={{ animation: 'progress 6s linear forwards' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Social Proof Overlay */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-xs text-white border border-white/20">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-green to-emerald-600 border-2 border-white/50 flex items-center justify-center text-[8px]">👦</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-pink to-pink-600 border-2 border-white/50 flex items-center justify-center text-[8px]">👧</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-yellow to-amber-600 border-2 border-white/50 flex items-center justify-center text-[8px]">🧒</div>
          </div>
          <span className="font-semibold">{totalUsers > 0 ? totalUsers.toLocaleString() : '500'}+ ishonadi</span>
        </div>
      </div>

      {/* Swipe Hint - Mobile only, first time */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 sm:hidden animate-bounce-subtle opacity-60 pointer-events-none">
        <div className="flex items-center gap-1 text-white/70 text-xs">
          <span>← Suring →</span>
        </div>
      </div>
    </div>
  );
};
