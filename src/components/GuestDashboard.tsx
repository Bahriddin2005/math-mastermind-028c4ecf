import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
  Quote
} from 'lucide-react';

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
      // Fetch testimonials
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (testimonialsData) {
        setTestimonials(testimonialsData);
      }

      // Fetch team members
      const { data: teamData } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (teamData) {
        setTeamMembers(teamData);
      }

      // Fetch platform stats using the function
      const { data: statsData } = await supabase.rpc('get_platform_stats');
      
      if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: Calculator,
      title: "4 xil mashq turi",
      description: "Qo'shish, ayirish, ko'paytirish va bo'lish bo'limlari",
      gradient: "from-blue-500/20 to-blue-600/5",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600"
    },
    {
      icon: Brain,
      title: "Mental Arifmetika",
      description: "Abakus usulida tez hisoblash ko'nikmalari",
      gradient: "from-purple-500/20 to-purple-600/5",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600"
    },
    {
      icon: Timer,
      title: "Vaqt rejimi",
      description: "Vaqtga qarshi mashq qilib tezlikni oshiring",
      gradient: "from-amber-500/20 to-amber-600/5",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-600"
    },
    {
      icon: Target,
      title: "Kundalik maqsad",
      description: "Har kuni belgilangan miqdorda mashq bajaring",
      gradient: "from-green-500/20 to-green-600/5",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-600"
    },
    {
      icon: Trophy,
      title: "Global reyting",
      description: "Butun dunyo foydalanuvchilari bilan raqobatlashing",
      gradient: "from-orange-500/20 to-orange-600/5",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-600"
    },
    {
      icon: Award,
      title: "Yutuqlar tizimi",
      description: "Maxsus medallar va yutuqlarni qo'lga kiriting",
      gradient: "from-pink-500/20 to-pink-600/5",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-600"
    }
  ];

  const displayStats = [
    { 
      value: stats.total_users > 0 ? stats.total_users.toLocaleString() : "100+", 
      label: "Foydalanuvchilar", 
      icon: Users 
    },
    { 
      value: stats.total_problems_solved > 0 ? stats.total_problems_solved.toLocaleString() : "10K+", 
      label: "Yechilgan masalalar", 
      icon: CheckCircle2 
    },
    { 
      value: stats.total_lessons > 0 ? `${stats.total_lessons}+` : "20+", 
      label: "Video darslar", 
      icon: GraduationCap 
    },
    { 
      value: "4.9", 
      label: "Reyting", 
      icon: Star 
    }
  ];


  const howItWorks = [
    { step: 1, title: "Ro'yxatdan o'ting", description: "Bepul hisob yarating", icon: User },
    { step: 2, title: "Bo'limni tanlang", description: "O'zingizga mos bo'limni tanlang", icon: Target },
    { step: 3, title: "Mashq qiling", description: "Kundalik mashqlarni bajaring", icon: Play },
    { step: 4, title: "Rivojlaning", description: "Statistikani kuzatib boring", icon: BarChart3 }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-8 sm:pb-0">
      {/* Hero Banner - Mobile optimized */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl gradient-primary p-6 sm:p-8 md:p-12 text-primary-foreground shadow-xl opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
        <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-primary-foreground/20 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">IQROMAX - Mental Arifmetika</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 sm:mb-4 leading-tight">
            Tez hisoblash ko'nikmalarini rivojlantiring
          </h1>
          <p className="text-sm sm:text-base md:text-lg opacity-90 mb-5 sm:mb-6 leading-relaxed">
            Zamonaviy onlayn platforma orqali mental arifmetika, diqqat va xotirani mustahkamlang.
          </p>
          <div className="flex flex-col xs:flex-row gap-3">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 shadow-lg h-12 sm:h-11 text-base sm:text-sm w-full xs:w-auto touch-target"
            >
              <Play className="h-5 w-5" />
              Bepul boshlash
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/courses')}
              className="gap-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 h-12 sm:h-11 text-base sm:text-sm w-full xs:w-auto touch-target"
            >
              <GraduationCap className="h-5 w-5" />
              Video darslar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar - Mobile grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {displayStats.map((stat, index) => (
          <Card key={index} className="p-3 sm:p-4 text-center border-border/40 hover:shadow-md transition-shadow">
            <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-primary" />
            <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Features Grid - Mobile optimized cards */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Platforma imkoniyatlari</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Barcha xususiyatlardan bepul foydalaning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`p-4 sm:p-5 bg-gradient-to-br ${feature.gradient} border-border/40 opacity-0 animate-slide-up hover:shadow-lg transition-all group cursor-pointer active:scale-[0.98] touch-target`}
              style={{ animationDelay: `${200 + index * 50}ms`, animationFillMode: 'forwards' }}
              onClick={() => navigate('/auth')}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl ${feature.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg mb-0.5 sm:mb-1">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works - Mobile horizontal scroll or vertical */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-display font-bold text-foreground">Qanday ishlaydi?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">4 oddiy qadamda boshlang</p>
          </div>
        </div>

        {/* Mobile: horizontal scroll, Desktop: grid */}
        <div className="sm:hidden opacity-0 animate-slide-up -mx-4 px-4 overflow-x-auto hide-scrollbar" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
            {howItWorks.map((item, index) => (
              <Card key={index} className="p-4 text-center border-border/40 relative w-[160px] flex-shrink-0">
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-lg">
                  {item.step}
                </div>
                <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-2">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm mb-0.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          {howItWorks.map((item, index) => (
            <Card key={index} className="p-5 text-center border-border/40 relative group hover:shadow-lg transition-all">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                {item.step}
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {index < howItWorks.length - 1 && (
                <ChevronRight className="hidden md:block absolute top-1/2 -right-6 h-8 w-8 text-muted-foreground/30" />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials Section with Carousel */}
      {testimonials.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '480ms', animationFillMode: 'forwards' }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Quote className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Foydalanuvchilar fikri</h2>
              <p className="text-sm text-muted-foreground">Platformamiz haqida sharhlar</p>
            </div>
          </div>

          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                  stopOnMouseEnter: true,
                }),
              ]}
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
                              <img 
                                src={testimonial.avatar_url} 
                                alt={testimonial.name} 
                                className="h-12 w-12 rounded-full object-cover"
                              />
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
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          "{testimonial.content}"
                        </p>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4" />
              <CarouselNext className="hidden md:flex -right-4" />
            </Carousel>
          </div>
        </div>
      )}

      {/* Team Section - Bizning Jamoa */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '510ms', animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Bizning Jamoa</h2>
            <p className="text-sm text-muted-foreground">Professional o'qituvchilar jamoasi</p>
          </div>
        </div>

        <div className="opacity-0 animate-slide-up" style={{ animationDelay: '520ms', animationFillMode: 'forwards' }}>
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {teamMembers.map((member) => (
                <CarouselItem key={member.id} className="md:basis-full">
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 p-4">
                    {/* Avatar with decorative border */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-md scale-110" />
                      <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full p-1 bg-gradient-to-br from-primary/20 to-accent/20">
                        <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden border-4 border-background">
                          {member.avatar_url ? (
                            <img 
                              src={member.avatar_url} 
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                              <User className="h-16 w-16 md:h-20 md:w-20 text-primary/40" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Decorative lines */}
                      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/30 rounded-tr-2xl" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent/30 rounded-bl-2xl" />
                    </div>

                    {/* Info card */}
                    <Card className="flex-1 p-6 md:p-8 bg-secondary/50 border-border/30 max-w-xl">
                      <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">
                        {member.name}
                      </h3>
                      <p className="text-primary font-semibold mb-4">{member.role}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {member.description}
                      </p>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {teamMembers.map((_, index) => (
                <div
                  key={index}
                  className="w-2.5 h-2.5 rounded-full bg-primary/30 transition-all"
                />
              ))}
            </div>
          </Carousel>
        </div>
      </div>

      {/* Video Lessons Section */}
      <Card className="overflow-hidden border-border/40 opacity-0 animate-slide-up" style={{ animationDelay: '520ms', animationFillMode: 'forwards' }}>
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8 bg-gradient-to-br from-purple-500 to-purple-700 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
              <GraduationCap className="h-4 w-4" />
              Video darslar
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Professional video kurslar</h3>
            <p className="opacity-90 mb-4">
              Tajribali o'qituvchilar tomonidan tayyorlangan video darslar orqali mental arifmetikani asoslaridan boshlab o'rganing.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" /> {stats.total_lessons > 0 ? `${stats.total_lessons}+` : '20+'} video darslar
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Amaliy mashqlar
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" /> Sertifikat olish imkoniyati
              </li>
            </ul>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              Darslarni ko'rish
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-6 md:p-8 bg-gradient-to-br from-secondary to-background flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Play className="h-12 w-12 text-purple-500" />
              </div>
              <p className="text-muted-foreground text-sm">
                Ro'yxatdan o'ting va video darslarni tomosha qiling
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}>
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
              <p className="text-sm opacity-90">Foydali maqolalar va maslahatlar</p>
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
              <h3 className="font-display font-bold text-lg mb-1">Ko'p so'raladigan savollar</h3>
              <p className="text-sm opacity-90">Savollaringizga javob toping</p>
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
              <p className="text-sm opacity-90">Biz bilan aloqaga chiqing</p>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <Card className="p-8 text-center bg-gradient-to-br from-secondary/50 via-primary/5 to-accent/5 border border-primary/20 opacity-0 animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
        <CardContent className="p-0">
          <div className="flex items-center justify-center mb-4">
            <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h3 className="text-2xl font-display font-bold mb-3">
            Hoziroq boshlang!
          </h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Ro'yxatdan o'ting va mental arifmetika dunyosiga qadam qo'ying. 
            Statistika, yutuqlar, video darslar va global reytingdan bepul foydalaning.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              <User className="h-5 w-5" />
              Bepul ro'yxatdan o'tish
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="gap-2">
              <Star className="h-5 w-5" />
              Tariflarni ko'rish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
