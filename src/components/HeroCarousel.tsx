import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from './ui/carousel';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

// Import hero images
import heroKidsImg from '@/assets/hero-kids.jpg';
import heroParentsImg from '@/assets/hero-parents.jpg';
import heroTeachersImg from '@/assets/hero-teachers.jpg';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  buttonText: string;
  href: string;
  image: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 'kids',
    title: "Bola uchun",
    subtitle: "O'yinlar orqali tez hisoblashni o'rgan",
    description: "Qiziqarli o'yinlar, animatsiyalar va mukofotlar bilan matematikani sevib o'rgan!",
    icon: "🎮",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    buttonText: "O'rganishni boshlash",
    href: "/train",
    image: heroKidsImg,
  },
  {
    id: 'parents',
    title: "Ota-ona uchun",
    subtitle: "Farzandingiz rivojini real vaqtda kuzating",
    description: "Batafsil statistika, kunlik hisobotlar va farzandingiz yutuqlarini ko'ring.",
    icon: "👨‍👩‍👧‍👦",
    gradient: "from-blue-500 via-cyan-500 to-sky-500",
    buttonText: "Kuzatishni boshlash",
    href: "/statistics",
    image: heroParentsImg,
  },
  {
    id: 'teachers',
    title: "O'qituvchi uchun",
    subtitle: "Darslarni oson boshqaring va natijani ko'ring",
    description: "O'quvchilar statistikasi, kurs yaratish va sertifikatlar berish imkoniyati.",
    icon: "👩‍🏫",
    gradient: "from-amber-500 via-yellow-500 to-orange-400",
    buttonText: "O'qitishni boshlash",
    href: "/courses",
    image: heroTeachersImg,
  },
];

export const HeroCarousel = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 5000,
            stopOnInteraction: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-2 md:pl-4">
              <div 
                className={`relative w-full min-h-[280px] xs:min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${slide.gradient} p-4 xs:p-5 sm:p-8 lg:p-10 flex flex-col justify-center overflow-hidden`}
              >
                {/* Animated background effects */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-3xl">
                  <div className="absolute -top-10 -right-10 sm:-top-20 sm:-right-20 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-2xl sm:blur-3xl animate-pulse" />
                  <div className="absolute -bottom-16 -left-16 sm:-bottom-32 sm:-left-32 w-40 sm:w-80 h-40 sm:h-80 bg-white/10 rounded-full blur-2xl sm:blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-12">
                  {/* Left side - Text content */}
                  <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
                    <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start mb-3 sm:mb-4">
                      <span className="text-3xl xs:text-4xl sm:text-5xl animate-bounce-soft">
                        {slide.icon}
                      </span>
                      <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/20 text-white text-xs sm:text-sm font-bold">
                        {slide.title}
                      </span>
                    </div>
                    <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-4xl font-display font-black text-white mb-2 sm:mb-3 leading-tight">
                      {slide.subtitle}
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 max-w-lg mx-auto lg:mx-0 line-clamp-2 sm:line-clamp-none">
                      {slide.description}
                    </p>
                    <Button 
                      size="default"
                      className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 h-auto"
                      onClick={() => navigate(slide.href)}
                    >
                      {slide.buttonText}
                      <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>

                  {/* Right side - Image */}
                  <div className="flex-shrink-0 order-1 lg:order-2 w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[280px] lg:max-w-[40%]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl transform rotate-3" />
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="relative w-full h-28 xs:h-32 sm:h-44 lg:h-56 object-cover rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-white/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Decorative floating elements - hide on very small screens */}
                <div className="hidden xs:block absolute top-2 sm:top-4 right-2 sm:right-4 text-lg sm:text-2xl animate-bounce opacity-70" style={{ animationDuration: '2s' }}>✨</div>
                <div className="hidden xs:block absolute bottom-2 sm:bottom-4 left-2 sm:left-4 text-base sm:text-xl animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}>⭐</div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom dots indicator */}
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                current === index 
                  ? 'w-6 sm:w-8 bg-primary' 
                  : 'w-1.5 sm:w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
