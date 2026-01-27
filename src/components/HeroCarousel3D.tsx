import { useState, useEffect, useCallback } from 'react';
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides: HeroSlide[] = [
    {
      id: 'kids',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&auto=format',
      gradientOverlay: 'from-black/80 via-black/40 to-transparent',
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
      image: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=1200&auto=format',
      gradientOverlay: 'from-blue-900/80 via-blue-900/40 to-transparent',
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
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format',
      gradientOverlay: 'from-amber-900/80 via-amber-900/40 to-transparent',
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
      setIsTransitioning(true);
      setCurrent(api.selectedScrollSnap());
      setTimeout(() => setIsTransitioning(false), 600);
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl animate-fade-in group">
      {/* 3D Perspective Container */}
      <div className="perspective-1000">
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
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-95'
                  }`}
                >
                  {/* 3D Animated Image Container */}
                  <div 
                    className={`absolute inset-0 transition-all duration-1000 ease-out transform-gpu ${
                      current === index 
                        ? 'scale-100 rotate-0' 
                        : 'scale-110 rotate-1'
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Parallax Image with 3D Transform */}
                    <div 
                      className={`absolute inset-0 transition-transform duration-[1200ms] ease-out ${
                        current === index 
                          ? 'translate-z-0' 
                          : '-translate-z-20'
                      }`}
                      style={{
                        transform: current === index 
                          ? 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)' 
                          : 'perspective(1000px) rotateY(5deg) rotateX(2deg) translateZ(-50px)',
                        transition: 'transform 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      }}
                    >
                      <img 
                        src={slide.image}
                        alt={slide.id}
                        className={`w-full h-full object-cover transition-all duration-1000 ${
                          current === index ? 'scale-100 blur-0' : 'scale-110 blur-sm'
                        }`}
                      />
                    </div>

                    {/* Animated Gradient Overlay with Depth */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-t ${slide.gradientOverlay} transition-opacity duration-700 ${
                        current === index ? 'opacity-100' : 'opacity-80'
                      }`}
                    />

                    {/* Floating Particles Effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`absolute w-2 h-2 bg-white/20 rounded-full animate-float-${i % 3}`}
                          style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 4) * 20}%`,
                            animationDelay: `${i * 0.5}s`,
                            animationDuration: `${3 + i * 0.5}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Content with Staggered Animation */}
                  <div 
                    className={`absolute inset-0 flex flex-col justify-end p-5 sm:p-8 md:p-10 text-white transition-all duration-700 ${
                      current === index 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {/* Badge Row */}
                    <div 
                      className={`flex items-center gap-2 sm:gap-3 mb-3 transition-all duration-500 delay-100 ${
                        current === index ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                    >
                      {slide.showLogo && (
                        <div className="bg-white rounded-xl p-2 shadow-lg transform hover:scale-105 transition-transform">
                          <img src={iqromaxLogo} alt="IQROMAX" className="h-7 sm:h-9 w-auto" />
                        </div>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${slide.badge.bgColor} rounded-full text-xs font-bold shadow-lg`}>
                        <slide.badge.icon className="h-3 w-3" />
                        {slide.badge.text}
                      </span>
                      {slide.badge.extraBadge && (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-[10px] font-bold">
                          {slide.badge.extraBadge}
                        </span>
                      )}
                    </div>

                    {/* Title with Typewriter Effect */}
                    <h1 
                      className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight mb-2 transition-all duration-500 delay-200 ${
                        current === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      {slide.title}
                    </h1>

                    {/* Description */}
                    <p 
                      className={`text-base sm:text-lg md:text-xl text-white/90 mb-4 max-w-xl transition-all duration-500 delay-300 ${
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
                        className={`gap-2 ${slide.cta.className} font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all h-11 sm:h-12 text-sm sm:text-base px-5 sm:px-6`}
                      >
                        <slide.cta.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        {slide.cta.text}
                      </Button>
                      {slide.showLogo && (
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => navigate('/train')}
                          className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 h-11 sm:h-12 text-sm sm:text-base px-5 sm:px-6"
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
          <CarouselPrevious className="left-2 sm:left-4 bg-white/20 border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all backdrop-blur-sm" />
          <CarouselNext className="right-2 sm:right-4 bg-white/20 border-white/30 text-white hover:bg-white/40 hover:scale-110 transition-all backdrop-blur-sm" />
        </Carousel>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm rounded-full">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => scrollTo(index)}
            className={`relative transition-all duration-300 ${
              current === index 
                ? 'w-8 h-2' 
                : 'w-2 h-2 hover:bg-white/60'
            } rounded-full overflow-hidden`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Background */}
            <span 
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                current === index ? 'bg-white' : 'bg-white/40'
              }`}
            />
            {/* Progress indicator for active slide */}
            {current === index && (
              <span 
                className="absolute inset-0 bg-kid-yellow rounded-full origin-left animate-progress"
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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-xs text-white border border-white/20 hover:bg-black/50 transition-all">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-green to-emerald-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow">👦</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-pink to-pink-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow" style={{ animationDelay: '0.1s' }}>👧</div>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-kid-yellow to-amber-600 border-2 border-white/50 flex items-center justify-center text-[8px] animate-bounce-slow" style={{ animationDelay: '0.2s' }}>🧒</div>
          </div>
          <span className="font-semibold">{totalUsers > 0 ? totalUsers.toLocaleString() : '500'}+ ishonadi</span>
        </div>
      </div>

      {/* 3D Depth Shadow */}
      <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/20 blur-xl rounded-full -z-10" />
    </div>
  );
};
