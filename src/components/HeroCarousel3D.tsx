import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  description: React.ReactNode;
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
        text: "Bolalar uchun #1 mental arifmetika",
        bgColor: 'bg-kid-yellow/90 text-gray-900',
      },
      title: (
        <>
          <span className="block text-kid-yellow drop-shadow-[0_2px_8px_rgba(255,200,0,0.4)]">🎮 O'ynab o'rganamiz!</span>
          <span className="block mt-1 text-white/95">🎯 Har kuni yangi topshiriqlar!</span>
        </>
      ),
      description: (
        <>
          🎯 O'yin orqali tez va aniq hisoblashni o'rganing!{' '}
          ⭐ XP to'plang, Level oshiring va yutuqlarga erishing! 🏆
        </>
      ),
      cta: {
        icon: Rocket,
        text: 'Hozir bepul boshlash',
        className: 'bg-white text-primary hover:bg-white/90',
      },
      showLogo: false,
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
        text: 'Ota-onalar nazorati',
        bgColor: 'bg-blue-500 text-white',
      },
      title: (
        <>
          <span className="block">Farzandingiz qanday</span>
          <span className="block text-kid-yellow">rivojlanayotganini kuzating 📊</span>
        </>
      ),
      description: (
        <>
          📊 Real vaqtda natijalarni ko'ring · 📋 Har kuni aniq hisobot oling · 💡 Farzandingizga mos tavsiyalarni oling
        </>
      ),
      cta: {
        icon: BarChart3,
        text: "Farzandim natijalari",
        className: 'bg-blue-500 text-white hover:bg-blue-600',
      },
    },
    {
      id: 'teachers',
      image: heroSlideTeachers,
      gradientOverlay: 'from-amber-900/60 via-amber-900/20 to-transparent',
      badge: {
        icon: GraduationCap,
        text: "O'qituvchilar paneli",
        bgColor: 'bg-amber-500 text-white',
        extraBadge: 'Beta',
      },
      title: (
        <>
          <span className="block">📊 Sinf natijalarini oson</span>
          <span className="block text-kid-yellow">va aniq boshqaring ✨</span>
        </>
      ),
      description: (
        <>
          📊 Har bir guruh bo'yicha aniq statistika · 📄 Hisobotlarni PDF/Excelda yuklab oling · 🏅 Avtomatik sertifikatlar tizimi
        </>
      ),
      cta: {
        icon: FileText,
        text: 'Panelga kirish',
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
      delay: 4000, 
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }), 
  []);

  return (
    <div 
      className="relative overflow-hidden rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl -mx-4 sm:mx-0"
    >
      <Carousel
        setApi={setApi}
        opts={{ 
          loop: true,
          dragFree: false,
          containScroll: 'trimSnaps',
          skipSnaps: false,
          duration: 15,
          dragThreshold: 3,
        }}
        plugins={[autoplayPlugin]}
        className="w-full touch-pan-y select-none"
      >
        <CarouselContent className="ml-0" style={{ touchAction: 'pan-y pinch-zoom' }}>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="touch-manipulation cursor-grab active:cursor-grabbing pl-0">
              {/* Mobile-optimized height - simplified for performance */}
              <div 
                className="relative h-[380px] xs:h-[420px] sm:h-[480px] md:h-[560px] lg:h-[640px] overflow-hidden"
              >
                {/* Image Background - no parallax on mobile for performance */}
                <img 
                  src={slide.image}
                  alt={slide.id}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ 
                    transform: 'scale(1.02)',
                  }}
                />

                {/* Simple gradient overlay - no animation on mobile */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-kid-yellow/20 opacity-60 hidden sm:block" />
                
                {/* Stronger gradient for mobile readability - simplified */}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 sm:from-black/60 sm:via-transparent sm:to-transparent" />
                
                {/* Vignette effect - static, no hover */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                
                {/* Animated glow spots - only on desktop */}
                <div className="hidden sm:block absolute top-1/4 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-kid-yellow/20 rounded-full blur-3xl opacity-50" />
                <div className="hidden sm:block absolute bottom-1/3 right-1/4 w-36 md:w-48 h-36 md:h-48 bg-primary/20 rounded-full blur-3xl opacity-40" />

                {/* Floating particles - only on desktop */}
                <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-60"
                      style={{
                        left: `${10 + (i * 12) % 80}%`,
                        top: `${20 + (i * 11) % 60}%`,
                        animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                        boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                </div>

                {/* Content - optimized padding for mobile */}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-end p-4 xs:p-5 sm:p-8 md:p-10 text-white text-center ${
                    current === index ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Badge Row - Simplified for mobile performance */}
                  <div 
                    className={`flex flex-wrap items-center justify-center gap-2 xs:gap-2.5 sm:gap-3 mb-3 xs:mb-4 sm:mb-5 ${
                      current === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {slide.showLogo && (
                      <div className="bg-white/95 rounded-xl xs:rounded-2xl sm:rounded-2xl p-2 xs:p-2.5 sm:p-3 shadow-2xl ring-2 ring-white/30">
                        <img src={iqromaxLogo} alt="IQROMAX" className="h-7 xs:h-8 sm:h-10 md:h-12 w-auto" />
                      </div>
                    )}
                    <div className="relative">
                      <span className={`relative inline-flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 px-3 xs:px-4 sm:px-5 py-1.5 xs:py-2 sm:py-2.5 ${slide.badge.bgColor} rounded-full text-[11px] xs:text-xs sm:text-sm font-black shadow-2xl border border-white/20`}>
                        <slide.badge.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                        <span className="tracking-wide">{slide.badge.text}</span>
                      </span>
                    </div>
                    {slide.badge.extraBadge && (
                      <span className="px-2.5 xs:px-3 py-1 xs:py-1.5 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 text-amber-900 rounded-full text-[10px] xs:text-xs sm:text-sm font-black shadow-xl border border-amber-200/50">
                        ✨ {slide.badge.extraBadge}
                      </span>
                    )}
                  </div>

                  {/* Title - Simplified for mobile performance */}
                  <h1 
                    className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.05] mb-3 xs:mb-4 sm:mb-5 md:mb-6 ${
                      current === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="text-white drop-shadow-2xl">
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description - Simplified glass card */}
                  <div 
                    className={`mb-5 xs:mb-6 sm:mb-7 md:mb-8 flex justify-center ${
                      current === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <div className="relative">
                      <p 
                        className="relative text-center text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl text-white max-w-sm xs:max-w-md sm:max-w-xl md:max-w-2xl leading-snug xs:leading-relaxed sm:leading-loose font-semibold tracking-wide px-3 py-2 xs:px-4 xs:py-3 sm:px-6 sm:py-4 bg-black/30 rounded-xl sm:rounded-2xl border border-white/20"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.9)'
                        }}
                      >
                        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {slide.description}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons - Simplified for mobile performance */}
                  <div 
                    className={`flex flex-row items-center justify-center gap-3 xs:gap-3.5 sm:gap-4 md:gap-5 ${
                      current === index ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Button 
                      size="lg"
                      onClick={() => navigate('/auth')}
                      className={`gap-2.5 xs:gap-3 sm:gap-4 ${slide.cta.className} font-black active:scale-95 h-12 xs:h-14 sm:h-16 md:h-[72px] text-base xs:text-lg sm:text-xl md:text-2xl px-6 xs:px-8 sm:px-10 md:px-14 rounded-2xl sm:rounded-3xl border-2 border-white/40 shadow-xl`}
                    >
                      <slide.cta.icon className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8" />
                      <span className="truncate font-black tracking-wide">{slide.cta.text}</span>
                    </Button>
                    {slide.showLogo && (
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/train')}
                        className="gap-2.5 xs:gap-3 bg-white/25 border-2 border-white/50 text-white hover:bg-white/40 active:scale-95 h-12 xs:h-14 sm:h-16 md:h-[72px] text-base xs:text-lg sm:text-xl md:text-2xl px-6 xs:px-8 sm:px-10 md:px-14 rounded-2xl sm:rounded-3xl font-black shadow-xl"
                      >
                        <Gamepad2 className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8" />
                        <span className="hidden xs:inline font-black">Demo sinash</span>
                        <span className="xs:hidden text-xl">🎮</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselPrevious className="hidden sm:flex left-2 md:left-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
        <CarouselNext className="hidden sm:flex right-2 md:right-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
      </Carousel>

      {/* Dot Indicators - Simplified */}
      <div className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-black/30 rounded-full">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollTo(index)}
            className={`relative transition-all duration-300 ${
              current === index 
                ? 'w-4 sm:w-5 h-1 sm:h-1.5' 
                : 'w-1 sm:w-1.5 h-1 sm:h-1.5 hover:bg-white/60 active:scale-110'
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
                style={{ animation: 'progress 4s linear forwards' }}
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

    </div>
  );
};
