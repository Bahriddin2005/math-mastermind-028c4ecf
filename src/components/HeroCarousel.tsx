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
        <CarouselContent>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <div 
                className={`relative w-full min-h-[50vh] sm:min-h-[55vh] rounded-3xl bg-gradient-to-r ${slide.gradient} p-6 sm:p-10 flex flex-col justify-center overflow-hidden`}
              >
                {/* Animated background effects */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
                  {/* Left side - Text content */}
                  <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
                    <div className="flex items-center gap-3 justify-center lg:justify-start mb-4">
                      <span className="text-4xl sm:text-5xl animate-bounce-soft">
                        {slide.icon}
                      </span>
                      <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-bold">
                        {slide.title}
                      </span>
                    </div>
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

                  {/* Right side - Image */}
                  <div className="flex-shrink-0 order-1 lg:order-2 w-full lg:w-2/5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl transform rotate-3" />
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="relative w-full h-40 sm:h-52 lg:h-64 object-cover rounded-2xl shadow-2xl border-4 border-white/30"
                      />
                    </div>
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
