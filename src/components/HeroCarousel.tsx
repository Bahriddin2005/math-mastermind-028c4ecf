import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from './ui/carousel';
import { Button } from './ui/button';
import { Play, Users, BookOpen, ArrowRight } from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string;
  buttonText: string;
  href: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: 'kids',
    title: "Bola uchun",
    subtitle: "O'yinlar orqali tez hisoblashni o'rgan",
    description: "Qiziqarli o'yinlar, animatsiyalar va mukofotlar bilan matematikani sevib o'rgan!",
    icon: "🎮",
    gradient: "from-violet-500 via-fuchsia-500 to-purple-600",
    buttonText: "O'rganishni boshlash",
    href: "/train",
  },
  {
    id: 'parents',
    title: "Ota-ona uchun",
    subtitle: "Farzandingiz rivojini real vaqtda kuzating",
    description: "Batafsil statistika, kunlik hisobotlar va farzandingiz yutuqlarini ko'ring.",
    icon: "👨‍👩‍👧‍👦",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    buttonText: "Kuzatishni boshlash",
    href: "/statistics",
  },
  {
    id: 'teachers',
    title: "O'qituvchi uchun",
    subtitle: "Darslarni oson boshqaring va natijani ko'ring",
    description: "O'quvchilar statistikasi, kurs yaratish va sertifikatlar berish imkoniyati.",
    icon: "👩‍🏫",
    gradient: "from-emerald-500 via-green-500 to-lime-500",
    buttonText: "O'qitishni boshlash",
    href: "/courses",
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
        <CarouselContent>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div 
                className={`relative w-full min-h-[40vh] sm:min-h-[45vh] rounded-3xl bg-gradient-to-r ${slide.gradient} p-6 sm:p-10 flex flex-col justify-center overflow-hidden`}
              >
                {/* Animated background effects */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                  <div className="flex-shrink-0 text-7xl sm:text-8xl lg:text-9xl animate-bounce-soft">
                    {slide.icon}
                  </div>
                  
                  <div className="flex-1 text-center lg:text-left">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold mb-4">
                      {slide.title}
                    </span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-white mb-3 leading-tight">
                      {slide.subtitle}
                    </h1>
                    <p className="text-white/80 text-base sm:text-lg mb-6 max-w-lg mx-auto lg:mx-0">
                      {slide.description}
                    </p>
                    <Button 
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                      onClick={() => navigate(slide.href)}
                    >
                      {slide.buttonText}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Decorative floating elements */}
                <div className="absolute top-4 right-4 text-2xl animate-bounce opacity-70" style={{ animationDuration: '2s' }}>✨</div>
                <div className="absolute bottom-4 left-4 text-xl animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}>⭐</div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom dots indicator */}
        <div className="flex justify-center gap-2 mt-4">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                current === index 
                  ? 'w-8 bg-primary' 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};
