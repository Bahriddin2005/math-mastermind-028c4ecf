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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = node.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePosition({ x, y });
      };
      const handleMouseLeave = () => {
        setMousePosition({ x: 0, y: 0 });
      };
      node.addEventListener('mousemove', handleMouseMove);
      node.addEventListener('mouseleave', handleMouseLeave);
    }
  }, []);

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
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl animate-fade-in mx-0 sm:mx-0"
    >
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
                {/* Image Background with Parallax */}
                <img 
                  src={slide.image}
                  alt={slide.id}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out"
                  style={{ 
                    transform: current === index 
                      ? `scale(1.08) translate(${mousePosition.x * -20}px, ${mousePosition.y * -15}px)` 
                      : 'scale(1.15)',
                  }}
                />

                {/* Stronger gradient for mobile readability */}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:from-black/30" />

                {/* Content - optimized padding for mobile */}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-end p-4 xs:p-5 sm:p-8 md:p-10 text-white text-center transition-all duration-700 ${
                    current === index ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Badge Row - Beautiful glassmorphism design with staggered animation */}
                  <div 
                    className={`flex flex-wrap items-center justify-center gap-2 xs:gap-2.5 sm:gap-3 mb-3 xs:mb-4 sm:mb-5 transition-all duration-500 ${
                      current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: current === index ? '100ms' : '0ms' }}
                  >
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

                  {/* Title - Premium typography with gradient and glow effect */}
                  <h1 
                    className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.05] mb-3 xs:mb-4 sm:mb-5 md:mb-6 transition-all duration-600 ${
                      current === index ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                    }`}
                    style={{ transitionDelay: current === index ? '200ms' : '0ms' }}
                  >
                    <span 
                      className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl" 
                      style={{ 
                        textShadow: '0 4px 30px rgba(0,0,0,0.7), 0 2px 10px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.15)',
                        WebkitTextStroke: '0.5px rgba(255,255,255,0.1)'
                      }}
                    >
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description - Premium glass card with elegant styling */}
                  <div 
                    className={`mb-5 xs:mb-6 sm:mb-7 md:mb-8 transition-all duration-500 ${
                      current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: current === index ? '300ms' : '0ms' }}
                  >
                    <div className="relative inline-block">
                      {/* Glow effect behind text */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 blur-xl rounded-2xl" />
                      <p 
                        className="relative text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl text-white max-w-sm xs:max-w-md sm:max-w-xl md:max-w-2xl leading-snug xs:leading-relaxed sm:leading-loose font-semibold tracking-wide px-3 py-2 xs:px-4 xs:py-3 sm:px-6 sm:py-4 bg-black/20 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/10"
                        style={{ 
                          textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 0 40px rgba(255,255,255,0.1)'
                        }}
                      >
                        <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text">
                          {slide.description}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons - Premium glassmorphism design */}
                  <div 
                    className={`flex flex-row justify-center gap-3 xs:gap-3.5 sm:gap-4 md:gap-5 transition-all duration-500 ${
                      current === index ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
                    }`}
                    style={{ transitionDelay: current === index ? '400ms' : '0ms' }}
                  >
                    <Button 
                      size="default"
                      onClick={() => navigate('/auth')}
                      className={`group relative overflow-hidden gap-2 xs:gap-2.5 sm:gap-3 ${slide.cta.className} font-bold shadow-2xl active:scale-95 transition-all duration-300 h-11 xs:h-12 sm:h-14 md:h-16 text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 md:px-10 rounded-xl sm:rounded-2xl flex-1 sm:flex-none border-2 border-white/20 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]`}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <slide.cta.icon className="h-5 w-5 xs:h-5 xs:w-5 sm:h-6 sm:w-6 drop-shadow-lg" />
                      <span className="truncate font-extrabold tracking-wide">{slide.cta.text}</span>
                    </Button>
                    {slide.showLogo && (
                      <Button 
                        size="default"
                        variant="outline"
                        onClick={() => navigate('/train')}
                        className="group relative overflow-hidden gap-2 xs:gap-2.5 bg-white/15 border-2 border-white/30 text-white hover:bg-white/25 hover:border-white/50 active:scale-95 h-11 xs:h-12 sm:h-14 md:h-16 text-sm xs:text-base sm:text-lg px-5 xs:px-6 sm:px-8 md:px-10 backdrop-blur-md rounded-xl sm:rounded-2xl transition-all duration-300 font-bold flex-1 sm:flex-none shadow-xl hover:shadow-2xl"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Gamepad2 className="h-5 w-5 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                        <span className="hidden xs:inline font-extrabold">Demo sinash</span>
                        <span className="xs:hidden text-lg">🎮</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Visible on all devices */}
        <CarouselPrevious className="flex left-1 sm:left-2 md:left-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 transition-all backdrop-blur-md h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
        <CarouselNext className="flex right-1 sm:right-2 md:right-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 transition-all backdrop-blur-md h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
      </Carousel>

      {/* Dot Indicators - Compact on mobile */}
      <div className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-black/50 backdrop-blur-sm rounded-full">
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

    </div>
  );
};
