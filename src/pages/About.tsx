import { useEffect, useState } from 'react';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Heart, 
  Rocket, 
  Award, 
  Globe,
  Mail,
  Linkedin,
  GraduationCap,
  Building2,
  CheckCircle2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string | null;
  avatar_url: string | null;
}

const About = () => {
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('order_index');
      
      if (data) {
        setTeamMembers(data);
      }
    };
    fetchTeam();
  }, []);

  const values = [
    {
      icon: Heart,
      title: "Bolalar uchun ishonch",
      description: "Har bir bola o'rganish qobiliyatiga ega. Biz ularga qiziqarli va quvonchli muhit yaratamiz.",
      gradient: "from-rose-500 to-pink-500",
    },
    {
      icon: Target,
      title: "Natijaga yo'naltirilgan",
      description: "Raqamlar va aniq natijalar asosida ish olib boramiz. Har bir o'quvchi progressi kuzatiladi.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Rocket,
      title: "Innovatsiya",
      description: "Eng zamonaviy texnologiyalar va gamifikatsiya usullarini qo'llaymiz.",
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Award,
      title: "Sifat",
      description: "Har bir dars, har bir mashq pedagogik asoslarga tayanib ishlab chiqilgan.",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  const milestones = [
    { year: '2023', title: 'Loyiha boshlandi', description: 'Birinchi prototip yaratildi' },
    { year: '2024 Q1', title: 'MVP', description: 'Birinchi foydalanuvchilar' },
    { year: '2024 Q2', title: 'Ota-ona paneli', description: 'Kuzatuv funksiyalari' },
    { year: '2024 Q4', title: 'Premium', description: 'Obuna tizimi ishga tushdi' },
  ];

  return (
    <PageBackground className="min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="container px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-xl">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            IQROMAX haqida
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            IQROMAX — O'zbekistondagi eng yetakchi mental arifmetika platformasi. 
            Bizning missiyamiz — har bir bolaning matematik salohiyatini ochish va 
            rivojlantirish, shu bilan birga o'rganishni qiziqarli qilish.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10 sm:mb-16">
          <Card className="p-5 sm:p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Missiya</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O'zbekistondagi har bir bolaga sifatli va qiziqarli ta'lim taqdim etish, 
                  o'yin orqali o'rganish metodikasini joriy qilish.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5 sm:p-6 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Viziya</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  2030-yilgacha Markaziy Osiyoda #1 bolalar EdTech platformasiga aylanish 
                  va 1 million bolaga ta'lim yetkazish.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-center mb-6 sm:mb-8">
            Bizning qadriyatlarimiz
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {values.map((value, index) => (
              <Card key={index} className="p-4 sm:p-5 text-center border-border/50 hover:shadow-md transition-all">
                <div className={`h-12 w-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-md`}>
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-foreground mb-1">{value.title}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-center mb-6 sm:mb-8">
            Bizning yo'limiz
          </h2>
          <div className="relative">
            {/* Line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-border sm:-translate-x-0.5" />
            
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`relative flex items-center gap-4 ${
                    index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-4 sm:left-1/2 w-3 h-3 rounded-full bg-primary border-4 border-background -translate-x-1.5 sm:-translate-x-1.5 z-10" />
                  
                  {/* Content */}
                  <div className={`ml-10 sm:ml-0 sm:w-[calc(50%-2rem)] ${index % 2 === 0 ? 'sm:pr-8 sm:text-right' : 'sm:pl-8'}`}>
                    <Card className="p-3 sm:p-4 border-border/50">
                      <span className="text-xs font-bold text-primary">{milestone.year}</span>
                      <h4 className="font-bold text-sm sm:text-base text-foreground">{milestone.title}</h4>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team */}
        {teamMembers.length > 0 && (
          <div className="max-w-4xl mx-auto mb-10 sm:mb-16">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-center mb-6 sm:mb-8">
              Bizning jamoa
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="p-4 text-center border-border/50 hover:shadow-md transition-all">
                  <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{member.name}</h4>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card className="max-w-3xl mx-auto p-6 sm:p-8 text-center bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-primary/20">
          <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-3">
            Biz bilan hamkorlik qiling
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Investorlar, hamkorlar va o'qituvchilar bilan ishlashga tayyormiz.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => navigate('/contact')} className="gap-2">
              <Mail className="h-4 w-4" />
              Bog'lanish
            </Button>
            <Button variant="outline" onClick={() => navigate('/pricing')} className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Tariflar
            </Button>
          </div>
        </Card>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default About;
