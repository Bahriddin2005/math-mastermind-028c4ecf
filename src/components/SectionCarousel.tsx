import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowRight, Play, Trophy, BookOpen, TrendingUp, Newspaper, Users, Calendar, Zap, Award } from 'lucide-react';

interface SectionItem {
  icon: string;
  title: string;
  description: string;
  href: string;
}

interface SectionCarouselProps {
  title: string;
  emoji: string;
  items: SectionItem[];
  gradient: string;
  buttonText: string;
  mainHref: string;
}

export const SectionCarousel = ({ title, emoji, items, gradient, buttonText, mainHref }: SectionCarouselProps) => {
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
    <div className="w-full py-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary font-semibold"
          onClick={() => navigate(mainHref)}
        >
          Barchasi
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {items.map((item, index) => (
            <CarouselItem key={index} className="pl-3 basis-[80%] sm:basis-1/2 lg:basis-1/3">
              <Card 
                className={`border-0 shadow-lg overflow-hidden bg-gradient-to-br ${gradient} cursor-pointer hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98] transition-all duration-300`}
                onClick={() => navigate(item.href)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              current === index 
                ? 'w-6 bg-primary' 
                : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'
            }`}
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>

      {/* Main Action Button */}
      <Button 
        className={`w-full mt-4 bg-gradient-to-r ${gradient} text-white font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg`}
        onClick={() => navigate(mainHref)}
      >
        {buttonText}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

// Predefined section data
export const kidsSection = {
  title: "Bolalar uchun",
  emoji: "👶",
  gradient: "from-violet-500 to-purple-600",
  buttonText: "O'yinni boshlash",
  mainHref: "/train",
  items: [
    { icon: "🎮", title: "Tez hisoblash", description: "Aqliy hisoblash tezligini oshiring", href: "/mental-arithmetic" },
    { icon: "🏆", title: "Kunlik chellanj", description: "Bugungi topshiriqlarni bajaring", href: "/weekly-game" },
    { icon: "🎯", title: "Mashqlar", description: "Turli qiyinlik darajalarida mashq qiling", href: "/train" },
    { icon: "🌟", title: "Yutuqlar", description: "O'z yutuqlaringizni to'plang", href: "/achievements" },
  ],
};

export const parentsSection = {
  title: "Ota-onalar uchun",
  emoji: "👨‍👩‍👧‍👦",
  gradient: "from-blue-500 to-cyan-600",
  buttonText: "Kuzatishni boshlash",
  mainHref: "/statistics",
  items: [
    { icon: "📊", title: "Statistika", description: "Farzandingiz rivojini kuzating", href: "/statistics" },
    { icon: "📈", title: "Rekordlar", description: "Eng yaxshi natijalarni ko'ring", href: "/records" },
    { icon: "🎯", title: "Maqsadlar", description: "Kunlik va haftalik maqsadlar", href: "/dashboard" },
    { icon: "🏅", title: "Yutuqlar", description: "Erishilgan yutuqlar ro'yxati", href: "/achievements" },
  ],
};

export const teachersSection = {
  title: "O'qituvchilar uchun",
  emoji: "👩‍🏫",
  gradient: "from-emerald-500 to-green-600",
  buttonText: "O'rganishni boshlash",
  mainHref: "/courses",
  items: [
    { icon: "📚", title: "Kurslar", description: "Video darslar va materiallar", href: "/courses" },
    { icon: "📝", title: "Varaqalar", description: "Mashq varaqalarini yarating", href: "/problem-sheet" },
    { icon: "👥", title: "O'quvchilar", description: "O'quvchilar boshqaruvi", href: "/dashboard" },
    { icon: "📜", title: "Sertifikatlar", description: "Sertifikat berish tizimi", href: "/courses" },
  ],
};

export const personalSection = {
  title: "Shaxsiy rivojlanish",
  emoji: "🚀",
  gradient: "from-orange-500 to-amber-500",
  buttonText: "Rivojlanishni boshlash",
  mainHref: "/profile",
  items: [
    { icon: "👤", title: "Profil", description: "Shaxsiy ma'lumotlar va sozlamalar", href: "/profile" },
    { icon: "🔥", title: "Streak", description: "Kunlik mashq seriyasi", href: "/dashboard" },
    { icon: "🎖️", title: "Badgelar", description: "To'plangan badgelar", href: "/badges" },
    { icon: "⚙️", title: "Sozlamalar", description: "Ilova sozlamalari", href: "/settings" },
  ],
};

export const blogSection = {
  title: "Blog / Foydali kontent",
  emoji: "📰",
  gradient: "from-pink-500 to-rose-500",
  buttonText: "Blogni o'qish",
  mainHref: "/blog",
  items: [
    { icon: "📖", title: "Maqolalar", description: "Foydali maqolalar va maslahatlar", href: "/blog" },
    { icon: "❓", title: "FAQ", description: "Ko'p so'raladigan savollar", href: "/faq" },
    { icon: "📞", title: "Aloqa", description: "Biz bilan bog'laning", href: "/contact" },
    { icon: "💡", title: "Maslahatlar", description: "O'qitish bo'yicha maslahatlar", href: "/blog" },
  ],
};
