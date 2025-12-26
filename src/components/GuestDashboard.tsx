import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
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
  MessageCircle,
  ChevronRight,
  Star,
  Clock,
  BarChart3,
  Gamepad2,
  HelpCircle,
  Phone,
  CheckCircle2
} from 'lucide-react';

export const GuestDashboard = () => {
  const navigate = useNavigate();

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

  const stats = [
    { value: "1000+", label: "Foydalanuvchilar", icon: Users },
    { value: "50K+", label: "Yechilgan masalalar", icon: CheckCircle2 },
    { value: "20+", label: "Video darslar", icon: GraduationCap },
    { value: "4.9", label: "Reyting", icon: Star }
  ];

  const howItWorks = [
    { step: 1, title: "Ro'yxatdan o'ting", description: "Bepul hisob yarating", icon: User },
    { step: 2, title: "Bo'limni tanlang", description: "O'zingizga mos bo'limni tanlang", icon: Target },
    { step: 3, title: "Mashq qiling", description: "Kundalik mashqlarni bajaring", icon: Play },
    { step: 4, title: "Rivojlaning", description: "Statistikani kuzatib boring", icon: BarChart3 }
  ];

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12 text-primary-foreground shadow-xl opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-primary-foreground/5 rounded-full" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-foreground/20 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            IQROMAX - Mental Arifmetika Platformasi
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight">
            Tez hisoblash ko'nikmalarini rivojlantiring
          </h1>
          <p className="text-base md:text-lg opacity-90 mb-6 leading-relaxed">
            Zamonaviy onlayn platforma orqali mental arifmetika, diqqat va xotirani mustahkamlang. 
            Bolalar va kattalar uchun interaktiv mashqlar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/auth')}
              className="gap-2 shadow-lg"
            >
              <Play className="h-5 w-5" />
              Bepul boshlash
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/courses')}
              className="gap-2 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <GraduationCap className="h-5 w-5" />
              Video darslar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 text-center border-border/40 hover:shadow-md transition-shadow">
            <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Platforma imkoniyatlari</h2>
            <p className="text-sm text-muted-foreground">Barcha xususiyatlardan bepul foydalaning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`p-5 bg-gradient-to-br ${feature.gradient} border-border/40 opacity-0 animate-slide-up hover:shadow-lg transition-all group cursor-pointer`}
              style={{ animationDelay: `${200 + index * 50}ms`, animationFillMode: 'forwards' }}
              onClick={() => navigate('/auth')}
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${feature.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Qanday ishlaydi?</h2>
            <p className="text-sm text-muted-foreground">4 oddiy qadamda boshlang</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
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

      {/* Video Lessons Section */}
      <Card className="overflow-hidden border-border/40 opacity-0 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
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
                <CheckCircle2 className="h-4 w-4" /> 20+ video darslar
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
