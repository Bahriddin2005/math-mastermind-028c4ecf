import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  Timer, 
  Trophy, 
  User,
  Sparkles,
  Target,
  Zap,
  GraduationCap,
  Users,
  Brain,
  Calculator,
  Award,
  BookOpen,
  ChevronRight,
  Star,
  BarChart3,
  Gamepad2,
  HelpCircle,
  Phone,
  CheckCircle2,
  Quote,
  ArrowRight,
  TrendingUp,
  Shield,
  Clock,
  Crown,
  Rocket,
  Heart,
  Eye
} from 'lucide-react';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string | null;
  avatar_url: string | null;
  order_index: number;
}

interface PlatformStats {
  total_users: number;
  total_problems_solved: number;
  total_lessons: number;
  total_courses: number;
}

export const GuestDashboard = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
        .order('order_index', { ascending: true });

      if (testimonialsData) {
        setTestimonials(testimonialsData);
      }

      const { data: teamData } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (teamData) {
        setTeamMembers(teamData);
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
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  // Audience segments
  const audienceSegments = [
    {
      id: 'kids',
      icon: Gamepad2,
      emoji: '🎮',
      title: "Bolalar uchun",
      ageRange: "5–14 yosh",
      description: "O'yin orqali o'rganing, XP to'plang, reytingda ko'taring",
      features: ["O'yinli mashqlar", "XP va Level tizimi", "Global reyting"],
      gradient: "from-emerald-500 to-green-600",
      href: "/auth"
    },
    {
      id: 'parents',
      icon: Eye,
      emoji: '👨‍👩‍👧‍👦',
      title: "Ota-onalar uchun",
      badge: "Kuzatish paneli",
      description: "Farzandingiz rivojini real vaqtda kuzating",
      features: ["Kunlik hisobot", "To'g'ri/xato statistika", "Tavsiyalar"],
      gradient: "from-blue-500 to-cyan-600",
      href: "/auth"
    },
    {
      id: 'teachers',
      icon: GraduationCap,
      emoji: '👩‍🏫',
      title: "O'qituvchilar uchun",
      badge: "Beta",
      description: "Sinf bo'yicha natijalarni kuzating",
      features: ["Guruh statistikasi", "Mashq yaratish", "Sertifikat berish"],
      gradient: "from-amber-500 to-orange-600",
      href: "/auth"
    }
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-8 sm:pb-0">
      {/* ✨ HERO SECTION - Premium, Clear Value Proposition */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-kid-purple p-5 sm:p-8 md:p-12 text-primary-foreground shadow-2xl opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-kid-yellow/20 rounded-full blur-2xl animate-float" />
        </div>
        
        <div className="relative z-10">
          {/* Top: Logo + Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/95 rounded-xl p-2 sm:p-3 shadow-lg">
                <img src={iqromaxLogo} alt="IQROMAX" className="h-8 sm:h-10 w-auto" />
              </div>
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-kid-yellow/90 text-gray-900 rounded-full text-xs font-bold shadow">
                  <Rocket className="h-3 w-3" />
                  #1 Mental Arifmetika Platformasi
                </span>
              </div>
            </div>
            
            {/* Social proof badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-sm rounded-full text-xs sm:text-sm border border-white/20">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kid-green to-emerald-600 border-2 border-white/50 flex items-center justify-center text-[10px]">👦</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kid-pink to-pink-600 border-2 border-white/50 flex items-center justify-center text-[10px]">👧</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kid-yellow to-amber-600 border-2 border-white/50 flex items-center justify-center text-[10px]">🧒</div>
              </div>
              <span className="font-semibold">{stats.total_users > 0 ? stats.total_users.toLocaleString() : '500+'}+ bolalar ishonadi</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="max-w-3xl mb-8">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black leading-tight mb-4">
              <span className="text-kid-yellow drop-shadow-lg">5–14</span> yoshli bolalar uchun 
              <span className="block sm:inline"> mental arifmetika platformasi</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed">
              O'yinlar orqali tez hisoblash, diqqat va xotirani rivojlantiring.
              <span className="hidden sm:inline"> Ota-onalar uchun kuzatuv paneli, o'qituvchilar uchun guruh boshqaruvi.</span>
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-kid-yellow" />
                <span className="text-xl sm:text-2xl font-display font-bold">{stats.total_users > 0 ? stats.total_users.toLocaleString() : '500'}+</span>
              </div>
              <span className="text-xs sm:text-sm text-white/70">Foydalanuvchilar</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-kid-green" />
                <span className="text-xl sm:text-2xl font-display font-bold">{stats.total_problems_solved > 0 ? (stats.total_problems_solved / 1000).toFixed(0) : '10'}K+</span>
              </div>
              <span className="text-xs sm:text-sm text-white/70">Yechilgan masala</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-kid-pink" />
                <span className="text-xl sm:text-2xl font-display font-bold">{stats.total_lessons > 0 ? stats.total_lessons : '20'}+</span>
              </div>
              <span className="text-xs sm:text-sm text-white/70">Video darslar</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-kid-yellow fill-kid-yellow" />
                <span className="text-xl sm:text-2xl font-display font-bold">4.9</span>
              </div>
              <span className="text-xs sm:text-sm text-white/70">Reyting</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col xs:flex-row gap-3">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 bg-white text-primary hover:bg-white/90 font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8"
            >
              <Play className="h-5 w-5" />
              Bepul boshlash
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/courses')}
              className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 h-12 sm:h-14 text-base sm:text-lg px-6 sm:px-8"
            >
              <GraduationCap className="h-5 w-5" />
              Video darslarni ko'rish
            </Button>
          </div>
        </div>
      </div>

      {/* 👥 AUDIENCE SEGMENTS - Who is this for? */}
      <div className="space-y-6 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2">Kim uchun?</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Har bir foydalanuvchi uchun maxsus imkoniyatlar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {audienceSegments.map((segment, index) => (
            <Card 
              key={segment.id}
              className={`relative overflow-hidden border-border/40 hover:shadow-xl transition-all cursor-pointer group hover:scale-[1.02] opacity-0 animate-slide-up`}
              style={{ animationDelay: `${150 + index * 50}ms`, animationFillMode: 'forwards' }}
              onClick={() => navigate(segment.href)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${segment.gradient} opacity-[0.08] group-hover:opacity-[0.12] transition-opacity`} />
              
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${segment.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{segment.emoji}</span>
                  </div>
                  {segment.badge && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      segment.badge === 'Beta' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {segment.badge}
                    </span>
                  )}
                  {segment.ageRange && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {segment.ageRange}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg mb-2">{segment.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>

                <ul className="space-y-2">
                  {segment.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 text-${segment.gradient.split('-')[1]}-500`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-border/40">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Batafsil <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 🎮 GAMIFICATION PREVIEW - XP, Level, Progress */}
      <div className="space-y-6 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-kid-purple to-purple-600 flex items-center justify-center shadow-lg">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">O'yin elementlari</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Har bir to'g'ri javob uchun mukofot</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 text-center border-border/40 bg-gradient-to-br from-kid-yellow/10 to-transparent">
            <div className="text-3xl sm:text-4xl mb-2">⚡</div>
            <div className="text-xl sm:text-2xl font-display font-bold text-foreground">XP</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Tajriba ballari</p>
          </Card>
          <Card className="p-4 sm:p-5 text-center border-border/40 bg-gradient-to-br from-kid-green/10 to-transparent">
            <div className="text-3xl sm:text-4xl mb-2">🏆</div>
            <div className="text-xl sm:text-2xl font-display font-bold text-foreground">Level</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Daraja tizimi</p>
          </Card>
          <Card className="p-4 sm:p-5 text-center border-border/40 bg-gradient-to-br from-kid-pink/10 to-transparent">
            <div className="text-3xl sm:text-4xl mb-2">🔥</div>
            <div className="text-xl sm:text-2xl font-display font-bold text-foreground">Streak</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Kunlik mashq</p>
          </Card>
          <Card className="p-4 sm:p-5 text-center border-border/40 bg-gradient-to-br from-kid-purple/10 to-transparent">
            <div className="text-3xl sm:text-4xl mb-2">🎖️</div>
            <div className="text-xl sm:text-2xl font-display font-bold text-foreground">Badges</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Yutuq nishonlari</p>
          </Card>
        </div>
      </div>

      {/* 🛣️ ROADMAP - For Investors */}
      <Card className="p-5 sm:p-8 border-border/40 bg-gradient-to-br from-secondary/50 to-transparent opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-kid-purple flex items-center justify-center shadow-lg">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Rivojlanish yo'l xaritasi</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Bizning rejalarimiz</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow">✓</div>
            <h4 className="font-bold text-sm sm:text-base mb-1">MVP</h4>
            <p className="text-xs text-muted-foreground">Asosiy mashqlar va o'yinlar</p>
          </div>
          <div className="relative p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow">2</div>
            <h4 className="font-bold text-sm sm:text-base mb-1">Parent Panel</h4>
            <p className="text-xs text-muted-foreground">Ota-onalar uchun panel</p>
          </div>
          <div className="relative p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow">3</div>
            <h4 className="font-bold text-sm sm:text-base mb-1">Monetizatsiya</h4>
            <p className="text-xs text-muted-foreground">Premium obunalar</p>
          </div>
          <div className="relative p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">4</div>
            <h4 className="font-bold text-sm sm:text-base mb-1">School Mode</h4>
            <p className="text-xs text-muted-foreground">Maktablar uchun</p>
          </div>
        </div>
      </Card>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <div className="space-y-6 opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Quote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Foydalanuvchilar fikri</h2>
              <p className="text-sm text-muted-foreground">Ota-onalar va o'qituvchilar sharhlari</p>
            </div>
          </div>

          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[Autoplay({ delay: 4000, stopOnInteraction: true })]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="p-6 border-border/40 hover:shadow-lg transition-all bg-gradient-to-br from-card to-secondary/20 h-full">
                    <div className="flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                          {testimonial.avatar_url ? (
                            <img src={testimonial.avatar_url} alt={testimonial.name} className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-bold truncate">{testimonial.name}</h4>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {renderStars(testimonial.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{testimonial.content}"</p>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
        <Card 
          className="p-5 bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 cursor-pointer hover:shadow-lg transition-all group"
          onClick={() => navigate('/blog')}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-1">Blog</h3>
              <p className="text-sm opacity-90">Foydali maqolalar</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 cursor-pointer hover:shadow-lg transition-all group"
          onClick={() => navigate('/faq')}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-1">FAQ</h3>
              <p className="text-sm opacity-90">Savollar va javoblar</p>
            </div>
          </div>
        </Card>

        <Card 
          className="p-5 bg-gradient-to-br from-orange-500 to-orange-700 text-white border-0 cursor-pointer hover:shadow-lg transition-all group"
          onClick={() => navigate('/contact')}
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg mb-1">Bog'lanish</h3>
              <p className="text-sm opacity-90">Aloqaga chiqing</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Final CTA */}
      <Card className="p-6 sm:p-8 text-center bg-gradient-to-br from-primary/10 via-kid-purple/10 to-kid-yellow/10 border border-primary/20 opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <CardContent className="p-0">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-xl">
              <Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold mb-3">
            Bugunoq boshlang!
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm sm:text-base">
            Bepul ro'yxatdan o'ting va farzandingizning mental arifmetika sayohatini boshlang.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2 h-12 px-6">
              <Play className="h-5 w-5" />
              Bepul boshlash
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="gap-2 h-12 px-6">
              <Crown className="h-5 w-5" />
              Tariflarni ko'rish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
