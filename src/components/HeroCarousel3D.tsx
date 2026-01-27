import { useState, useEffect, useCallback, useRef } from 'react';
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
import heroKidsLearning from '@/assets/hero-kids-learning.jpg';
import heroParentsChild from '@/assets/hero-parents-child.jpg';
import heroTeacherClass from '@/assets/hero-teacher-class.jpg';

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
}

interface HeroCarousel3DProps {
  totalUsers: number;
}

export const HeroCarousel3D = ({ totalUsers }: HeroCarousel3DProps) => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);

  const slides: HeroSlide[] = [
    {
      id: 'kids',
      image: heroKidsLearning,
      gradientOverlay: 'from-black/70 via-black/30 to-transparent',
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
    },
    {
      id: 'parents',
      image: heroParentsChild,
      gradientOverlay: 'from-blue-900/70 via-blue-900/30 to-transparent',
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
      image: heroTeacherClass,
      gradientOverlay: 'from-amber-900/70 via-amber-900/30 to-transparent',
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
  ];

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

  // Mouse parallax effect handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    // Reset to center smoothly
    setMousePosition({ x: 0.5, y: 0.5 });
  }, []);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  // Calculate 3D transform values based on mouse position
  const getParallaxStyle = (depth: number = 1) => {
    if (!isHovering) {
      return {
        transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1.05)',
        transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      };
    }
    
    const rotateY = (mousePosition.x - 0.5) * 10 * depth;
    const rotateX = (0.5 - mousePosition.y) * 8 * depth;
    const translateX = (mousePosition.x - 0.5) * 20 * depth;
    const translateY = (mousePosition.y - 0.5) * 15 * depth;
    
    return {
      transform: `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateX(${translateX}px) translateY(${translateY}px) translateZ(0px) scale(1.1)`,
      transition: 'transform 0.1s ease-out',
    };
  };

  // Calculate content parallax (moves opposite to image for depth)
  const getContentParallaxStyle = () => {
    if (!isHovering) {
      return {
        transform: 'translateX(0px) translateY(0px)',
        transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      };
    }
    
    const translateX = (0.5 - mousePosition.x) * 15;
    const translateY = (0.5 - mousePosition.y) * 10;
    
    return {
      transform: `translateX(${translateX}px) translateY(${translateY}px)`,
      transition: 'transform 0.15s ease-out',
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl animate-fade-in group cursor-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Custom 3D Cursor */}
      {isHovering && (
        <div 
          className="absolute w-8 h-8 pointer-events-none z-50 mix-blend-difference"
          style={{
            left: `${mousePosition.x * 100}%`,
            top: `${mousePosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.05s ease-out, top 0.05s ease-out',
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-white/80 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-white/30" />
        </div>
      )}

      {/* 3D Perspective Container */}
      <div className="perspective-1000" style={{ transformStyle: 'preserve-3d' }}>
        <Carousel
          setApi={setApi}
          opts={{ loop: true }}
          plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={slide.id}>
                <div 
                  className={`relative h-[400px] sm:h-[450px] md:h-[500px] overflow-hidden transition-all duration-700 ease-out ${
                    current === index 
                      ? 'opacity-100' 
                      : 'opacity-0'
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* 3D Parallax Image Container */}
                  <div 
                    className="absolute inset-[-20px] transform-gpu"
                    style={{
                      ...getParallaxStyle(1),
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Main Image with Ken Burns + Parallax */}
                    <img 
                      src={slide.image}
                      alt={slide.id}
                      className={`w-full h-full object-cover transition-all duration-1000 ${
                        current === index ? 'blur-0' : 'blur-sm'
                      }`}
                      style={{
                        filter: isHovering ? 'brightness(1.05) saturate(1.1)' : 'brightness(1) saturate(1)',
                        transition: 'filter 0.3s ease-out',
                      }}
                    />

                    {/* Shine/Reflection Effect on Hover */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
                      }}
                    />
                  </div>

                  {/* Animated Gradient Overlay with Depth */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay} transition-opacity duration-700`}
                  />

                  {/* Floating 3D Particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full bg-white/20 backdrop-blur-sm"
                        style={{
                          width: `${6 + (i % 3) * 4}px`,
                          height: `${6 + (i % 3) * 4}px`,
                          left: `${10 + i * 12}%`,
                          top: `${15 + (i % 5) * 18}%`,
                          animation: `float-${i % 3} ${4 + i * 0.5}s ease-in-out infinite`,
                          animationDelay: `${i * 0.3}s`,
                          transform: isHovering 
                            ? `translateX(${(mousePosition.x - 0.5) * (20 + i * 5)}px) translateY(${(mousePosition.y - 0.5) * (15 + i * 4)}px)`
                            : 'translateX(0) translateY(0)',
                          transition: 'transform 0.2s ease-out',
                        }}
                      />
                    ))}
                  </div>

                  {/* Depth Layer - Subtle Glow Behind Content */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
                      ...getContentParallaxStyle(),
                    }}
                  />

                  {/* Content with Inverse Parallax for 3D Depth */}
                  <div 
                    className={`absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 text-white transition-all duration-700 ${
                      current === index 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={getContentParallaxStyle()}
                  >
                    {/* Badge Row */}
                    <div 
                      className={`flex items-center gap-2 sm:gap-3 mb-3 transition-all duration-500 delay-100 ${
                        current === index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                    >
                      {slide.showLogo && (
                        <div 
                          className="bg-white rounded-xl p-2 shadow-lg transform hover:scale-110 transition-transform"
                          style={{
                            boxShadow: isHovering ? '0 15px 40px -10px rgba(0,0,0,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.3)',
                          }}
                        >
                          <img src={iqromaxLogo} alt="IQROMAX" className="h-7 sm:h-9 w-auto" />
                        </div>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${slide.badge.bgColor} rounded-full text-xs font-bold shadow-lg backdrop-blur-sm`}>
                        <slide.badge.icon className="h-3 w-3" />
                        {slide.badge.text}
                      </span>
                      {slide.badge.extraBadge && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-[10px] font-bold shadow-md">
                          {slide.badge.extraBadge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h1 
                      className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight mb-2 transition-all duration-500 delay-200 drop-shadow-lg ${
                        current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      {slide.title}
                    </h1>

                    {/* Description */}
                    <p 
                      className={`text-base sm:text-lg md:text-xl text-white/90 mb-4 max-w-xl transition-all duration-500 delay-300 drop-shadow-md ${
                        current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      {slide.description}
                    </p>

                    {/* CTA Buttons */}
                    <div 
                      className={`flex flex-col xs:flex-row gap-2 sm:gap-3 transition-all duration-500 delay-400 ${
                        current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      <Button 
                        size="lg"
                        onClick={() => navigate('/auth')}
                        className={`gap-2 ${slide.cta.className} font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all h-11 sm:h-12 text-sm sm:text-base px-5 sm:px-6 cursor-pointer`}
                      >
                        <slide.cta.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        {slide.cta.text}
                      </Button>
                      {slide.showLogo && (
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => navigate('/train')}
                          className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 h-11 sm:h-12 text-sm sm:text-base px-5 sm:px-6 backdrop-blur-sm cursor-pointer"
                        >
                          <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          Demo sinab ko'ring
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Arrows */}
          <CarouselPrevious className="left-2 sm:left-4 bg-white/20 border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all backdrop-blur-sm cursor-pointer" />
          <CarouselNext className="right-2 sm:right-4 bg-white/20 border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all backdrop-blur-sm cursor-pointer" />
        </Carousel>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-full">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollTo(index)}
            className={`relative transition-all duration-300 cursor-pointer ${
              current === index 
                ? 'w-8 h-2' 
                : 'w-2 h-2 hover:bg-white/60'
            } rounded-full overflow-hidden`}
            aria-label={`Go to slide ${index + 1}`}
          >
            <span 
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                current === index ? 'bg-white' : 'bg-white/40'
              }`}
            />
            {current === index && (
              <span 
                className="absolute inset-0 bg-kid-yellow rounded-full origin-left"
                style={{
                  animation: 'progress 5s linear forwards',
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Social Proof Overlay */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-xs text-white border border-white/20 hover:bg-black/50 transition-all cursor-default"
          style={getContentParallaxStyle()}
        >
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-green to-emerald-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow">👦</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-pink to-pink-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow" style={{ animationDelay: '0.1s' }}>👧</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-yellow to-amber-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow" style={{ animationDelay: '0.2s' }}>🧒</div>
          </div>
          <span className="font-semibold">{totalUsers > 0 ? totalUsers.toLocaleString() : '500'}+ ishonadi</span>
        </div>
      </div>

      {/* 3D Depth Shadow */}
      <div 
        className="absolute -bottom-4 left-4 right-4 h-8 bg-black/20 blur-xl rounded-full -z-10 transition-all duration-300"
        style={{
          transform: isHovering 
            ? `translateX(${(mousePosition.x - 0.5) * 10}px) scaleX(${1 + Math.abs(mousePosition.x - 0.5) * 0.1})`
            : 'translateX(0) scaleX(1)',
        }}
      />
    </div>
  );
};
