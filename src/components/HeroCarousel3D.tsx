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
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl animate-fade-in mx-0 sm:mx-0">
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
              {/* Mobile-optimized height */}
              <div className="relative h-[320px] xs:h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden">
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

                {/* Stronger gradient for mobile readability */}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:from-black/30" />

                {/* Content - optimized padding for mobile */}
                <div 
                  className={`absolute inset-0 flex flex-col justify-end p-4 xs:p-5 sm:p-8 md:p-10 text-white transition-all duration-500 ${
                    current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                >
                  {/* Badge Row - Beautiful glassmorphism design */}
                  <div className="flex flex-wrap items-center gap-2 xs:gap-2.5 sm:gap-3 mb-3 xs:mb-4 sm:mb-5">
                    {slide.showLogo && (
                      <div className="bg-white/95 backdrop-blur-md rounded-xl xs:rounded-2xl sm:rounded-2xl p-2 xs:p-2.5 sm:p-3 shadow-2xl ring-2 ring-white/30 hover:scale-105 transition-transform duration-300">
                        <img src={iqromaxLogo} alt="IQROMAX" className="h-7 xs:h-8 sm:h-10 md:h-12 w-auto" />
                      </div>
                    )}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-kid-yellow via-amber-400 to-kid-orange rounded-full blur-md opacity-60 group-hover:opacity-80 transition-opacity" />
                      <span className={`relative inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 ${slide.badge.bgColor} rounded-full text-[11px] xs:text-xs sm:text-sm font-black shadow-2xl backdrop-blur-md border border-white/20`}>
                        <slide.badge.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 drop-shadow-md" />
                        <span className="tracking-wide">{slide.badge.text}</span>
                      </span>
                    </div>
                    {slide.badge.extraBadge && (
                      <span className="px-2.5 xs:px-3 py-1 xs:py-1.5 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-900 rounded-full text-[10px] xs:text-xs sm:text-sm font-black shadow-xl border border-amber-200/50 animate-pulse">
                        ✨ {slide.badge.extraBadge}
                      </span>
                    )}
                  </div>

                  {/* Title - Premium typography with glow effect */}
                  <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.1] mb-2 xs:mb-3 sm:mb-4 md:mb-5">
                    <span 
                      className="text-white drop-shadow-2xl bg-clip-text" 
                      style={{ 
                        textShadow: '0 4px 20px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.1)'
                      }}
                    >
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description - Elegant styling with glass effect */}
                  <p 
                    className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-4 xs:mb-5 sm:mb-6 md:mb-8 max-w-lg sm:max-w-xl md:max-w-2xl leading-relaxed sm:leading-relaxed line-clamp-2 sm:line-clamp-none font-medium tracking-wide"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                  >
                    {slide.description}
                  </p>

                  {/* CTA Buttons - stack on mobile, row on larger */}
                  <div className="flex flex-row gap-2 xs:gap-2.5 sm:gap-3 md:gap-4">
                    <Button 
                      size="default"
                      onClick={() => navigate('/auth')}
                      className={`gap-1.5 xs:gap-2 sm:gap-2.5 ${slide.cta.className} font-bold shadow-xl active:scale-95 transition-all duration-200 h-9 xs:h-10 sm:h-12 md:h-14 text-xs xs:text-sm sm:text-base px-3 xs:px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl flex-1 sm:flex-none`}
                    >
                      <slide.cta.icon className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                      <span className="truncate">{slide.cta.text}</span>
                    </Button>
                    {slide.showLogo && (
                      <Button 
                        size="default"
                        variant="outline"
                        onClick={() => navigate('/train')}
                        className="gap-1.5 xs:gap-2 bg-white/20 border border-white/40 text-white hover:bg-white/30 active:scale-95 h-9 xs:h-10 sm:h-12 md:h-14 text-xs xs:text-sm sm:text-base px-3 xs:px-4 sm:px-6 md:px-8 backdrop-blur-sm rounded-lg sm:rounded-xl transition-all duration-200 font-semibold flex-1 sm:flex-none"
                      >
                        <Gamepad2 className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">Demo</span>
                        <span className="xs:hidden">🎮</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselPrevious className="hidden md:flex left-3 bg-white/20 border-white/30 text-white hover:bg-white/40 transition-all backdrop-blur-sm h-10 w-10" />
        <CarouselNext className="hidden md:flex right-3 bg-white/20 border-white/30 text-white hover:bg-white/40 transition-all backdrop-blur-sm h-10 w-10" />
      </Carousel>

      {/* Dot Indicators - Compact on mobile */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/50 backdrop-blur-sm rounded-full">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollTo(index)}
            className={`relative transition-all duration-300 ${
              current === index 
                ? 'w-5 sm:w-7 h-1.5 sm:h-2' 
                : 'w-1.5 sm:w-2 h-1.5 sm:h-2 hover:bg-white/60 active:scale-110'
            } rounded-full overflow-hidden`}
            aria-label={`Slayd ${index + 1}`}
          >
            <span 
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                current === index ? 'bg-white' : 'bg-white/50'
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

      {/* Social Proof Overlay - Compact on mobile */}
      <div className="absolute top-2 right-2 xs:top-3 xs:right-3 sm:top-4 sm:right-4 z-10">
        <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-[10px] xs:text-xs text-white border border-white/20">
          <div className="flex -space-x-1 xs:-space-x-1.5">
            <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-gradient-to-br from-kid-green to-emerald-600 border border-white/50 flex items-center justify-center text-[7px] xs:text-[8px]">👦</div>
            <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-gradient-to-br from-kid-pink to-pink-600 border border-white/50 flex items-center justify-center text-[7px] xs:text-[8px]">👧</div>
            <div className="w-4 h-4 xs:w-5 xs:h-5 rounded-full bg-gradient-to-br from-kid-yellow to-amber-600 border border-white/50 flex items-center justify-center text-[7px] xs:text-[8px]">🧒</div>
          </div>
          <span className="font-semibold whitespace-nowrap">{totalUsers > 0 ? totalUsers.toLocaleString() : '500'}+</span>
        </div>
      </div>

      {/* Swipe Hint - Mobile only */}
      <div className="absolute bottom-12 xs:bottom-14 left-1/2 -translate-x-1/2 z-10 sm:hidden animate-pulse opacity-70 pointer-events-none">
        <div className="flex items-center gap-1 text-white text-[10px] xs:text-xs bg-black/30 px-2.5 py-1 rounded-full backdrop-blur-sm">
          <span>👆 Suring</span>
        </div>
      </div>
    </div>
  );
};
