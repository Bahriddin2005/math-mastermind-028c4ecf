import { useNavigate } from 'react-router-dom';
import { useEffect, useState, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from './ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Play, 
  Trophy, 
  User,
  GraduationCap,
  Users,
  Calculator,
  Award,
  ChevronRight,
  Star,
  BarChart3,
  Gamepad2,
  CheckCircle2,
  Quote,
  ArrowRight,
  TrendingUp,
  Crown,
  Rocket,
  Eye,
  Zap,
  Target,
  Shield,
  Brain,
  Clock,
  FileText
} from 'lucide-react';
import { HeroCarousel3D } from './HeroCarousel3D';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string | null;
}

interface PlatformStats {
  total_users: number;
  total_problems_solved: number;
  total_lessons: number;
  total_courses: number;
}

export const GuestDashboard = forwardRef<HTMLDivElement, object>((_, ref) => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    total_users: 0,
    total_problems_solved: 0,
    total_lessons: 0,
    total_courses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(6);

      if (testimonialsData) {
        setTestimonials(testimonialsData);
      }

      const { data: statsData } = await supabase.rpc('get_platform_stats');
      
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3.5 w-3.5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Audience segments - simplified
  const audienceSegments = [
    {
      id: 'kids',
      emoji: '🎮',
      title: "Bolalar",
      ageRange: "5–14 yosh",
      description: "O'yin orqali tez hisoblashni o'rganing",
      features: ["XP va Level tizimi", "Global reyting", "Badges to'plash"],
      gradient: "from-emerald-500 to-green-600",
      borderColor: "border-emerald-500/30",
      href: "/auth"
    },
    {
      id: 'parents',
      emoji: '👨‍👩‍👧',
      title: "Ota-onalar",
      badge: "Kuzatuv paneli",
      description: "Farzandingiz rivojini real vaqtda kuzating",
      features: ["Kunlik hisobot", "Progress statistika", "Tavsiyalar"],
      gradient: "from-blue-500 to-cyan-600",
      borderColor: "border-blue-500/30",
      href: "/auth"
    },
    {
      id: 'teachers',
      emoji: '👩‍🏫',
      title: "O'qituvchilar",
      badge: "Beta",
      description: "Sinf natijalarini oson boshqaring",
      features: ["Guruh statistikasi", "PDF/Excel eksport", "Sertifikatlar"],
      gradient: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
      href: "/auth"
    }
  ];

  // Platform benefits
  const benefits = [
    { icon: Brain, title: "Tez hisoblash", desc: "Mental arifmetika metodikasi" },
    { icon: Target, title: "Diqqatni oshirish", desc: "Konsentratsiyani mustahkamlash" },
    { icon: Clock, title: "Xotirani rivojlantirish", desc: "Qisqa va uzoq xotira" },
    { icon: Award, title: "O'ziga ishonch", desc: "Muvaffaqiyat motivatsiyasi" },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 sm:pb-0">
      {/* ✨ HERO SECTION - 3D Carousel with Animations */}
      <HeroCarousel3D totalUsers={stats.total_users} />

      {/* 👥 WHO IS THIS FOR - Audience Segments */}
      <div className="space-y-4 sm:space-y-5">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">Kim uchun?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Har bir foydalanuvchi uchun maxsus</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {audienceSegments.map((segment, index) => (
            <Card 
              key={segment.id}
              className={`relative overflow-hidden border ${segment.borderColor} hover:shadow-lg transition-all cursor-pointer group hover:scale-[1.02]`}
              onClick={() => navigate(segment.href)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${segment.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity`} />
              
              <CardContent className="relative p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${segment.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="text-xl sm:text-2xl">{segment.emoji}</span>
                  </div>
                  {segment.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                      segment.badge === 'Beta' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {segment.badge}
                    </span>
                  )}
                  {segment.ageRange && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {segment.ageRange}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-base sm:text-lg mb-1">{segment.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">{segment.description}</p>

                <ul className="space-y-1.5">
                  {segment.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 pt-3 border-t border-border/40">
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Boshlash <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 🎮 GAMIFICATION PREVIEW - Why it works */}
      <Card className="p-4 sm:p-6 border-border/40 bg-gradient-to-br from-kid-purple/5 to-kid-yellow/5">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-kid-purple to-purple-600 flex items-center justify-center shadow-md">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">O'yin elementlari</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Har bir to'g'ri javob uchun mukofot</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 sm:p-4 text-center rounded-xl bg-gradient-to-br from-kid-yellow/20 to-transparent border border-kid-yellow/20">
            <div className="text-2xl sm:text-3xl mb-1">⚡</div>
            <div className="text-sm sm:text-base font-display font-bold">XP</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Tajriba</p>
          </div>
          <div className="p-3 sm:p-4 text-center rounded-xl bg-gradient-to-br from-kid-green/20 to-transparent border border-kid-green/20">
            <div className="text-2xl sm:text-3xl mb-1">🏆</div>
            <div className="text-sm sm:text-base font-display font-bold">Level</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Daraja</p>
          </div>
          <div className="p-3 sm:p-4 text-center rounded-xl bg-gradient-to-br from-kid-orange/20 to-transparent border border-kid-orange/20">
            <div className="text-2xl sm:text-3xl mb-1">🔥</div>
            <div className="text-sm sm:text-base font-display font-bold">Streak</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Ketma-ket</p>
          </div>
          <div className="p-3 sm:p-4 text-center rounded-xl bg-gradient-to-br from-kid-pink/20 to-transparent border border-kid-pink/20">
            <div className="text-2xl sm:text-3xl mb-1">🎖️</div>
            <div className="text-sm sm:text-base font-display font-bold">Badges</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Nishonlar</p>
          </div>
        </div>
      </Card>

      {/* 📈 BENEFITS - What you get */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">Nima foyda?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Mental arifmetika natijalari</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-3 sm:p-4 text-center border-border/40 hover:shadow-md transition-all group">
              <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h4 className="font-display font-bold text-xs sm:text-sm mb-0.5">{benefit.title}</h4>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{benefit.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 🛣️ ROADMAP - For Investors */}
      <Card className="p-4 sm:p-6 border-border/40 bg-gradient-to-br from-secondary/50 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-kid-purple flex items-center justify-center shadow-md">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">Rivojlanish yo'li</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Bizning rejalarimiz</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <div className="relative p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow">✓</div>
            <h4 className="font-bold text-xs sm:text-sm mb-0.5">MVP</h4>
            <p className="text-[9px] sm:text-xs text-muted-foreground">O'yin va mashqlar</p>
          </div>
          <div className="relative p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow">2</div>
            <h4 className="font-bold text-xs sm:text-sm mb-0.5">Parent</h4>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Ota-ona paneli</p>
          </div>
          <div className="relative p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow">3</div>
            <h4 className="font-bold text-xs sm:text-sm mb-0.5">Premium</h4>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Obunalar</p>
          </div>
          <div className="relative p-3 sm:p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="absolute -top-2 -left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow">4</div>
            <h4 className="font-bold text-xs sm:text-sm mb-0.5">School</h4>
            <p className="text-[9px] sm:text-xs text-muted-foreground">Maktablar</p>
          </div>
        </div>
      </Card>

      {/* 💬 TESTIMONIALS - Social Proof */}
      {testimonials.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md">
              <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-foreground">Fikrlar</h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Ota-onalar va o'qituvchilar</p>
            </div>
          </div>

          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-3">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-3 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                  <Card className="p-4 sm:p-5 border-border/40 hover:shadow-md transition-all h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                        {testimonial.avatar_url ? (
                          <img src={testimonial.avatar_url} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-sm truncate">{testimonial.name}</h4>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {renderStars(testimonial.rating)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">"{testimonial.content}"</p>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* 🚀 FINAL CTA */}
      <Card className="p-5 sm:p-8 text-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
        <div className="flex items-center justify-center mb-3 sm:mb-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
            <Rocket className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-display font-bold mb-2">
          Bugunoq boshlang!
        </h3>
        <p className="text-muted-foreground mb-4 sm:mb-5 max-w-md mx-auto text-xs sm:text-sm">
          Bepul ro'yxatdan o'ting va farzandingizning mental arifmetika sayohatini boshlang.
        </p>
        <div className="flex flex-col xs:flex-row justify-center gap-2 sm:gap-3">
          <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-10 sm:h-11 px-5 sm:px-6 text-sm">
            <Play className="h-4 w-4" />
            Bepul boshlash
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="gap-2 h-10 sm:h-11 px-5 sm:px-6 text-sm">
            <Crown className="h-4 w-4" />
            Tariflar
          </Button>
        </div>
      </Card>
    </div>
  );
});

GuestDashboard.displayName = 'GuestDashboard';
