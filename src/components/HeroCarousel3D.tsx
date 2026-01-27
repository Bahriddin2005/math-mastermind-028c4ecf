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
import { useCursorTrail } from '@/hooks/useCursorTrail';

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
  const [typedText, setTypedText] = useState<{ [key: number]: string }>({});
  const [isTyping, setIsTyping] = useState<{ [key: number]: boolean }>({});
  const containerDivRef = useRef<HTMLDivElement>(null);
  
  // Enable cursor trail effect
  useCursorTrail(containerDivRef, true);
  
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      (containerDivRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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

  // Slide titles for typing animation
  const slideTitles = useMemo(() => [
    "5–14 yosh uchun",
    "Farzandingiz rivojini kuzating",
    "Sinf natijalarini oson boshqaring"
  ], []);

  // Typing animation effect
  useEffect(() => {
    if (current === undefined) return;
    
    const fullText = slideTitles[current];
    setTypedText(prev => ({ ...prev, [current]: '' }));
    setIsTyping(prev => ({ ...prev, [current]: true }));
    
    let charIndex = 0;
    const typeDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (charIndex <= fullText.length) {
          setTypedText(prev => ({ ...prev, [current]: fullText.slice(0, charIndex) }));
          charIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(prev => ({ ...prev, [current]: false }));
        }
      }, 60);
      
      return () => clearInterval(typeInterval);
    }, 400);
    
    return () => clearTimeout(typeDelay);
  }, [current, slideTitles]);

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
          <span className="text-kid-yellow drop-shadow-lg">5–14</span> yosh uchun
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
      className="relative overflow-hidden rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl animate-fade-in -mx-4 sm:mx-0"
      style={{ perspective: '1200px' }}
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
              {/* Mobile-optimized height with 3D depth */}
              <div 
                className="relative h-[350px] xs:h-[400px] sm:h-[450px] md:h-[520px] lg:h-[580px] overflow-hidden transition-all duration-700 ease-out"
                style={{ 
                  transform: current === index 
                    ? 'rotateY(0deg) scale(1)' 
                    : current > index 
                      ? 'rotateY(-15deg) scale(0.9) translateX(-10%)' 
                      : 'rotateY(15deg) scale(0.9) translateX(10%)',
                  transformStyle: 'preserve-3d',
                }}
              >
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

                {/* Animated gradient overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-kid-yellow/20 bg-[length:400%_400%] animate-[gradient-shift_8s_ease-in-out_infinite] opacity-60"
                />
                
                {/* Blur overlay for better text readability */}
                <div className="absolute inset-0 backdrop-blur-[2px] sm:backdrop-blur-[1px]" />
                
                {/* Stronger gradient for mobile readability */}
                <div className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 sm:from-black/50 sm:via-transparent sm:to-transparent" />
                
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                
                {/* Animated glow spots */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-kid-yellow/20 rounded-full blur-3xl animate-pulse opacity-50" />
                <div className="absolute bottom-1/3 right-1/4 w-24 h-24 sm:w-48 sm:h-48 bg-primary/20 rounded-full blur-3xl animate-pulse opacity-40" style={{ animationDelay: '1s' }} />

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full opacity-60"
                      style={{
                        left: `${10 + (i * 7) % 80}%`,
                        top: `${20 + (i * 11) % 60}%`,
                        animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                        boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
                      }}
                    />
                  ))}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={`star-${i}`}
                      className="absolute text-white/70 animate-pulse"
                      style={{
                        left: `${15 + (i * 15) % 70}%`,
                        top: `${10 + (i * 13) % 50}%`,
                        fontSize: `${8 + (i % 3) * 4}px`,
                        animationDelay: `${i * 0.5}s`,
                        filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))',
                      }}
                    >
                      ✦
                    </div>
                  ))}
                </div>

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

                  {/* Title - Premium typography with typing animation */}
                  <h1 
                    className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-[1.05] mb-3 xs:mb-4 sm:mb-5 md:mb-6 transition-all duration-600 ${
                      current === index ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                    }`}
                    style={{ 
                      transitionDelay: current === index ? '200ms' : '0ms',
                      transform: current === index ? 'translateZ(50px)' : 'translateZ(0px)',
                    }}
                  >
                    <span 
                      className="bg-gradient-to-r from-white via-kid-yellow to-white bg-[length:200%_100%] bg-clip-text text-transparent drop-shadow-2xl animate-[gradient-shift_3s_ease-in-out_infinite]" 
                      style={{ 
                        textShadow: '0 4px 30px rgba(0,0,0,0.7), 0 2px 10px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.15)',
                        WebkitTextStroke: '0.5px rgba(255,255,255,0.2)',
                        filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.3))',
                      }}
                    >
                      {current === index ? (
                        <>
                          {index === 0 && (
                            <>
                              <span className="text-kid-yellow drop-shadow-lg">
                                {typedText[index]?.slice(0, 4) || ''}
                              </span>
                              {typedText[index]?.slice(4) || ''}
                            </>
                          )}
                          {index === 1 && (
                            <>
                              {typedText[index]?.slice(0, 13) || ''}
                              <span className="text-kid-yellow">
                                {typedText[index]?.slice(13, 21) || ''}
                              </span>
                              {typedText[index]?.slice(21) || ''}
                            </>
                          )}
                          {index === 2 && (
                            <>
                              <span className="text-kid-yellow">
                                {typedText[index]?.slice(0, 18) || ''}
                              </span>
                              {typedText[index]?.slice(18) || ''}
                            </>
                          )}
                          {isTyping[index] && (
                            <span 
                              className="inline-block w-[4px] h-[0.85em] bg-kid-yellow ml-1 animate-[blink_0.8s_ease-in-out_infinite]"
                              style={{ verticalAlign: 'text-bottom' }}
                            />
                          )}
                        </>
                      ) : slide.title}
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
                        className="relative text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl text-white max-w-sm xs:max-w-md sm:max-w-xl md:max-w-2xl leading-snug xs:leading-relaxed sm:leading-loose font-semibold tracking-wide px-3 py-2 xs:px-4 xs:py-3 sm:px-6 sm:py-4 bg-black/30 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20"
                        style={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,1), 0 4px 20px rgba(0,0,0,0.9), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(255,255,255,0.15)'
                        }}
                      >
                        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          {slide.description}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* CTA Buttons - Premium glassmorphism design */}
                  <div 
                    className={`flex flex-row items-center justify-center gap-3 xs:gap-3.5 sm:gap-4 md:gap-5 transition-all duration-500 ${
                      current === index ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
                    }`}
                    style={{ transitionDelay: current === index ? '400ms' : '0ms' }}
                  >
                    <Button 
                      size="lg"
                      onClick={() => navigate('/auth')}
                      className={`group relative overflow-hidden gap-2.5 xs:gap-3 sm:gap-4 ${slide.cta.className} font-black active:scale-95 transition-all duration-300 h-12 xs:h-14 sm:h-16 md:h-[72px] text-base xs:text-lg sm:text-xl md:text-2xl px-6 xs:px-8 sm:px-10 md:px-14 rounded-2xl sm:rounded-3xl border-2 border-white/40 hover:border-white/80 hover:scale-105`}
                      style={{
                        boxShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.2), inset 0 0 20px rgba(255,255,255,0.1)',
                      }}
                    >
                      {/* Neon glow border */}
                      <span className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(34,197,94,0.6), 0 0 90px rgba(34,197,94,0.4)' }} />
                      {/* Shimmer effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {/* Glow pulse */}
                      <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white/15 animate-pulse" />
                      <slide.cta.icon className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-transform duration-300" />
                      <span className="truncate font-black tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{slide.cta.text}</span>
                    </Button>
                    {slide.showLogo && (
                      <Button 
                        size="lg"
                        variant="outline"
                        onClick={() => navigate('/train')}
                        className="group relative overflow-hidden gap-2.5 xs:gap-3 bg-white/25 border-2 border-white/50 text-white hover:bg-white/40 hover:border-white/80 active:scale-95 h-12 xs:h-14 sm:h-16 md:h-[72px] text-base xs:text-lg sm:text-xl md:text-2xl px-6 xs:px-8 sm:px-10 md:px-14 backdrop-blur-lg rounded-2xl sm:rounded-3xl transition-all duration-300 font-black hover:scale-105"
                        style={{
                          boxShadow: '0 0 15px rgba(255,255,255,0.2), 0 0 30px rgba(59,130,246,0.3), 0 0 45px rgba(59,130,246,0.15), inset 0 0 15px rgba(255,255,255,0.05)',
                        }}
                      >
                        {/* Neon glow border */}
                        <span className="absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 25px rgba(255,255,255,0.4), 0 0 50px rgba(59,130,246,0.5), 0 0 75px rgba(59,130,246,0.3)' }} />
                        {/* Shimmer effect */}
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {/* Glow pulse */}
                        <span className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-white/10 animate-pulse" />
                        <Gamepad2 className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                        <span className="hidden xs:inline font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">Demo sinash</span>
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
        <CarouselPrevious className="hidden sm:flex left-2 md:left-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 transition-all backdrop-blur-md sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
        <CarouselNext className="hidden sm:flex right-2 md:right-3 bg-white/20 border-white/30 text-white hover:bg-white/40 active:scale-90 transition-all backdrop-blur-md sm:h-10 sm:w-10 md:h-12 md:w-12 shadow-xl" />
      </Carousel>

      {/* Dot Indicators - Compact on mobile */}
      <div className="absolute bottom-1 sm:bottom-1.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-black/30 backdrop-blur-sm rounded-full">
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
