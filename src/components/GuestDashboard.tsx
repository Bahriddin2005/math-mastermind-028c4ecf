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
import { TractionStats } from './TractionStats';
import { InvestorHighlights } from './InvestorHighlights';

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

export const GuestDashboard = () => {
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

  // Audience segments
  const audienceSegments = [
    {
      id: 'kids',
      emoji: '🧒',
      title: "Bolalar",
      subtitle: "Tez hisoblash, diqqat va fikrlash rivojlanadi",
      features: ["XP va Level tizimi", "Global reyting", "Badges to'plash"],
      gradient: "from-emerald-500 to-green-600",
      borderColor: "border-emerald-200 dark:border-emerald-800/40",
      bgTint: "from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card",
      ctaColor: "text-emerald-600 dark:text-emerald-400",
      href: "/auth"
    },
    {
      id: 'parents',
      emoji: '👨‍👩‍👧',
      title: "Ota-onalar",
      badge: "Kuzatuv paneli",
      subtitle: "Farzandingiz nima o'rganyapti — hammasi ko'z oldingizda",
      features: ["Har kunlik mashg'ulotlar", "Rivojlanish ko'rsatkichlari", "Qanday yordam berish bo'yicha tavsiyalar"],
      gradient: "from-blue-500 to-cyan-600",
      borderColor: "border-blue-200 dark:border-blue-800/40",
      bgTint: "from-blue-50/60 to-white dark:from-blue-950/20 dark:to-card",
      ctaColor: "text-blue-600 dark:text-blue-400",
      href: "/auth"
    },
    {
      id: 'teachers',
      emoji: '👩‍🏫',
      title: "O'qituvchilar",
      badge: "Beta",
      subtitle: "Sinf va guruh natijalarini bir joyda ko'ring",
      features: ["Guruh statistikasi", "Hisobotlarni yuklab olish (PDF / Excel)", "Diplomlar berish imkoniyati"],
      gradient: "from-amber-500 to-orange-600",
      borderColor: "border-amber-200 dark:border-amber-800/40",
      bgTint: "from-amber-50/60 to-white dark:from-amber-950/20 dark:to-card",
      ctaColor: "text-amber-600 dark:text-amber-400",
      href: "/auth"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 sm:pb-0">
      {/* ✨ HERO SECTION */}
      <HeroCarousel3D totalUsers={stats.total_users} />

      {/* 📊 TRACTION STATS */}
      <TractionStats />

      {/* 🎯 BU QANDAY ISHLAYDI */}
      <div className="space-y-4 sm:space-y-5">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">🎯 Bu qanday ishlaydi?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">🧒 Bolalar o'ynab o'rganadi · 📈 Qisqa vaqt ichida sezilarli natija</p>
        </div>

        {/* Audience cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {audienceSegments.map((segment) => (
            <Card 
              key={segment.id}
              className={`relative overflow-hidden border ${segment.borderColor} hover:shadow-lg transition-all cursor-pointer group hover:scale-[1.02] bg-gradient-to-br ${segment.bgTint}`}
              onClick={() => navigate(segment.href)}
            >
              <CardContent className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${segment.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <span className="text-3xl">{segment.emoji}</span>
                  </div>
                  {segment.badge && (
                    <span className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold ${
                      segment.badge === 'Beta' 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {segment.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg sm:text-xl mb-1">{segment.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{segment.subtitle}</p>

                <ul className="space-y-2.5">
                  {segment.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-border/30">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${segment.ctaColor} group-hover:gap-2.5 transition-all`}>
                    Boshlash <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 🎮 O'YIN ELEMENTLARI */}
      <Card className="p-4 sm:p-6 border-border/40 bg-gradient-to-br from-card to-secondary/30">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-2xl">🎮</span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">O'yin elementlari</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">🎁 Har bir to'g'ri javob uchun mukofot</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { emoji: '⚡', title: 'XP', desc: 'Tajriba ballari' },
            { emoji: '🏆', title: 'Level', desc: 'Darajalar' },
            { emoji: '🔥', title: 'Streak', desc: 'Ketma-ketlik' },
            { emoji: '⭐', title: 'Badges', desc: 'Yutuq nishonlari' },
          ].map((item, i) => (
            <div key={i} className="p-3 sm:p-4 text-center rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all">
              <div className="text-3xl sm:text-4xl mb-2">{item.emoji}</div>
              <div className="text-sm sm:text-base font-display font-bold">{item.title}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ❓ IQROMAX'DA NIMA O'RGANILADI */}
      <div className="space-y-4 sm:space-y-5">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">❓ IQROMAX'da nima o'rganiladi?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">🧒 Bolalar uchun mashqlar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Mental arifmetika */}
          <Card className="border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg">Mental arifmetika</h3>
                  <p className="text-xs text-muted-foreground">🎮 O'yinlar orqali tez va aniq hisoblash</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs font-semibold text-foreground mb-2">Bola qanday foyda oladi?</p>
                <ul className="space-y-1.5">
                  {["Tez fikrlash va hisoblash rivojlanadi", "Diqqat va mantiq kuchayadi", "Matematika qiziqarli bo'lib boradi", "O'ziga ishonch ortadi"].map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tez o'qish */}
          <Card className="border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-card overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <span className="text-2xl">📖</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg">Tez o'qish</h3>
                  <p className="text-xs text-muted-foreground">📚 Matnni tez, to'g'ri va tushunib o'qish</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs font-semibold text-foreground mb-2">Bola qanday foyda oladi?</p>
                <ul className="space-y-1.5">
                  {["O'qish tezligi oshadi", "Matnni yaxshiroq tushunadi", "Darslarda va uy vazifasida vaqt tejaladi", "O'qishga qiziqish ortadi"].map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 👩‍🏫 O'QITUVCHILAR UCHUN KURSLAR */}
      <div className="space-y-4 sm:space-y-5">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-1">👩‍🏫 O'qituvchilar uchun kurslar</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">🎓 Amaliy bilim va metodikalar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { emoji: '✍️', title: "Savod chiqarish metodikasi", desc: "Bolalarga o'qish va yozishni to'g'ri o'rgatish usullari", cardClass: "border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-card", iconClass: "bg-gradient-to-br from-emerald-500 to-green-600", checkClass: "text-emerald-500", features: ["Savodni bosqichma-bosqich o'rgatish", "Xatolar bilan ishlash metodlari", "Tayyor dars rejalar"] },
            { emoji: '✒️', title: "Kalligrafiya", desc: "Chiroyli va tartibli yozuvni o'rgatish metodikasi", cardClass: "border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-card", iconClass: "bg-gradient-to-br from-blue-500 to-cyan-600", checkClass: "text-blue-500", features: ["Yozuvni to'g'rilash usullari", "Qo'l motorikasini rivojlantirish", "Amaliy mashqlar to'plami"] },
            { emoji: '✖️', title: "Karra jadvali metodikasi", desc: "Karra jadvalni oson va esda qolarli o'rgatish yo'llari", cardClass: "border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/20 dark:to-card", iconClass: "bg-gradient-to-br from-amber-500 to-orange-600", checkClass: "text-amber-500", features: ["Yodlashsiz o'rgatish usullari", "O'yinli mashqlar", "Tez natija beradigan metodlar"] },
            { emoji: '🎓', title: "Milliy sertifikatga tayyorlov", desc: "Rasmiy sertifikat imtihonlariga tayyorlov kurslari", cardClass: "border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/60 to-white dark:from-purple-950/20 dark:to-card", iconClass: "bg-gradient-to-br from-purple-500 to-violet-600", checkClass: "text-purple-500", features: ["Imtihon formatiga mos mashqlar", "Bilimlarni mustahkamlash", "Sertifikat olishga puxta tayyorgarlik"] },
            { emoji: '🚀', title: "Zamonaviy malaka oshirish", desc: "O'qituvchilar uchun yangi metodlar va yondashuvlar", cardClass: "border-rose-200 dark:border-rose-800/40 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/20 dark:to-card", iconClass: "bg-gradient-to-br from-rose-500 to-pink-600", checkClass: "text-rose-500", features: ["Zamonaviy pedagogik usullar", "O'yin orqali ta'lim berish", "Dars samaradorligini oshirish"] },
          ].map((course, i) => (
            <Card key={i} className={`${course.cardClass} overflow-hidden`}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-11 w-11 rounded-2xl ${course.iconClass} flex items-center justify-center shadow-md`}>
                    <span className="text-xl">{course.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base truncate">{course.title}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{course.desc}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/30">
                  <p className="text-[10px] font-semibold text-foreground mb-1.5">Foydasi:</p>
                  <ul className="space-y-1">
                    {course.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className={`h-3 w-3 ${course.checkClass} shrink-0`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 💡 INVESTOR HIGHLIGHTS */}
      <InvestorHighlights />

      {/* ✅ IQROMAX NIMASI BILAN QULAY */}
      <Card className="p-4 sm:p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
            <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">✅ IQROMAX nimasi bilan qulay?</h2>
          </div>
        </div>

        <ul className="space-y-3 mb-4">
          {[
            { emoji: '🧒', text: "Bolalar uchun qiziqarli va foydali mashqlar" },
            { emoji: '👩‍🏫', text: "O'qituvchilar uchun amaliy kurslar" },
            { emoji: '👨‍👩‍👧', text: "Ota-onalar uchun kuzatuv va hisobotlar" },
            { emoji: '🇺🇿', text: "To'liq o'zbek tilida platforma" },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-sm font-medium">{item.emoji} {item.text}</span>
            </li>
          ))}
        </ul>

        <div className="p-3 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            🌱 IQROMAX doim yangilanadi: yangi topshiriqlar, yangi o'yinlar va yanada foydali imkoniyatlar bilan.
          </p>
        </div>
      </Card>

      {/* 🛣️ ROADMAP */}
      <Card className="p-4 sm:p-6 border-border/40 bg-gradient-to-br from-secondary/50 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
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

      {/* 💬 TESTIMONIALS */}
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

      {/* 🟢 FINAL CTA */}
      <Card className="p-5 sm:p-8 text-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
        <h3 className="text-lg sm:text-xl font-display font-bold mb-3">
          🟢 Bitta platforma — ikki yo'nalish
        </h3>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 max-w-sm mx-auto">
          <div className="text-center p-4 rounded-xl bg-card border border-border/40">
            <div className="text-3xl mb-2">🎮</div>
            <p className="text-sm sm:text-base font-bold">Bola</p>
            <p className="text-xs text-muted-foreground">o'rganadi</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-card border border-border/40">
            <div className="text-3xl mb-2">👩‍🏫</div>
            <p className="text-sm sm:text-base font-bold">O'qituvchi</p>
            <p className="text-xs text-muted-foreground">rivojlanadi</p>
          </div>
        </div>

        <p className="text-muted-foreground mb-4 sm:mb-5 max-w-md mx-auto text-xs sm:text-sm">
          👉 Hoziroq boshlang va farqni ko'ring.
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
};
