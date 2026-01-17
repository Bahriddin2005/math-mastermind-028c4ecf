import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { Mascot } from '@/components/Mascot';
import { GameCard } from '@/components/kids/GameCard';
import { ProgressRing } from '@/components/kids/ProgressRing';
import { StarBadge, GoldStar, TrophyBadge } from '@/components/kids/StarBadge';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Flame,
  Star,
  Crown,
  Play,
  Trophy,
  BookOpen,
  Zap,
  Award,
  TrendingUp,
  Calendar,
  FileText,
} from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { SectionCarousel, kidsSection, parentsSection, teachersSection, personalSection, blogSection } from '@/components/SectionCarousel';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  daily_goal: number;
  current_streak: number;
  avatar_url: string | null;
}

const KidsHome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todaySolved, setTodaySolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');
  const [mascotMessage, setMascotMessage] = useState<string | undefined>();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Xayrli tong";
    if (hour < 18) return "Xayrli kun";
    return "Xayrli kech";
  };

  // Get mascot message based on progress
  const getMascotMessage = (solved: number, goal: number) => {
    const progress = (solved / goal) * 100;
    if (progress >= 100) return "Ajoyib! Maqsadga erishdingiz! 🎉";
    if (progress >= 75) return "Zo'r! Ozgina qoldi!";
    if (progress >= 50) return "Yaxshi! Davom eting!";
    if (progress >= 25) return "Rahmat! Harakat qiling!";
    return "Bugun nima o'ynaymiz?";
  };

  useEffect(() => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }

    if (!user) return;

    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          username: profileData.username,
          total_score: profileData.total_score || 0,
          total_problems_solved: profileData.total_problems_solved || 0,
          best_streak: profileData.best_streak || 0,
          daily_goal: profileData.daily_goal || 20,
          current_streak: profileData.current_streak || 0,
          avatar_url: profileData.avatar_url,
        });
      }

      // Get today's solved problems
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('correct')
        .eq('user_id', user.id)
        .gte('created_at', today);

      const solved = sessionsData?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0;
      setTodaySolved(solved);

      // Update mascot based on progress
      const goal = profileData?.daily_goal || 20;
      const progress = (solved / goal) * 100;
      
      if (progress >= 100) {
        setMascotMood('celebrating');
        triggerConfetti('stars');
      } else if (progress >= 50) {
        setMascotMood('excited');
      } else {
        setMascotMood('happy');
      }
      
      setMascotMessage(getMascotMessage(solved, goal));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  const dailyGoalProgress = profile ? Math.min((todaySolved / profile.daily_goal) * 100, 100) : 0;
  const level = Math.floor((profile?.total_score || 0) / 1000) + 1;
  const xpProgress = ((profile?.total_score || 0) % 1000) / 10;

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          {/* IqroMax Logo - Clean & Elegant */}
          <div className="relative animate-fade-in">
            {/* Subtle glow behind logo */}
            <div className="absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full scale-150" />
            
            {/* Main logo */}
            <img 
              src="/favicon.jpg" 
              alt="IqroMax" 
              className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            
            {/* Floating sparkles */}
            <div className="absolute -top-3 -right-3 text-3xl animate-bounce-soft">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce-soft" style={{ animationDelay: '0.5s' }}>⭐</div>
          </div>
          
          {/* Loading text */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">Yuklanmoqda...</p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      {/* Hero Carousel */}
      <div className="container px-4 py-6">
        <HeroCarousel />
      </div>

      {/* Main Action Button */}
      <div className="container px-4">
        <button
          onClick={() => navigate('/train')}
          className="w-full h-20 rounded-2xl flex items-center justify-center gap-4 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 shadow-xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          <span className="text-4xl">🎮</span>
          <span className="text-xl font-bold text-white">O'ynab o'rgan</span>
          <Play className="w-6 h-6 text-white ml-2" />
        </button>
      </div>

      {/* Section Carousels */}
      <div className="container px-4">
        <SectionCarousel {...kidsSection} />
        <SectionCarousel {...parentsSection} />
        <SectionCarousel {...teachersSection} />
        <SectionCarousel {...personalSection} />
        <SectionCarousel {...blogSection} />
      </div>

      {/* Subscription Plans */}
      <div className="container px-4">
        <SubscriptionPlans />
      </div>

      {/* Main Game Cards */}
      <div className="container px-4 py-6">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <span className="text-3xl">🎯</span>
          Bugun nima o'ynaymiz?
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <GameCard
            title="Kunlik musobaqa"
            description="Bugungi chellenjni yechib, do'stlaringiz bilan poygalashing!"
            icon={Calendar}
            color="purple"
            badge="🔥 HOT"
            emoji="🎯"
            onClick={() => navigate('/weekly-game')}
            size="lg"
          />
          
          <GameCard
            title="Tez hisoblash"
            description="Aqliy matematikada o'z kuchingizni sinab ko'ring!"
            icon={Zap}
            color="blue"
            badge="⚡ TEZKOR"
            emoji="🧮"
            onClick={() => navigate('/mental-arithmetic')}
            size="lg"
          />
          
          <GameCard
            title="Video darslar"
            description="Yangi usullarni o'rganing va mahoratni oshiring!"
            icon={BookOpen}
            color="green"
            badge="📚 YANGI"
            emoji="🎬"
            onClick={() => navigate('/courses')}
            size="lg"
          />
        </div>
      </div>

      {/* More Features */}
      <div className="container px-4 py-6">
        <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <span className="text-3xl">🌟</span>
          Ko'proq imkoniyatlar
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <GameCard
            title="Reyting"
            icon={Trophy}
            color="yellow"
            emoji="🏆"
            onClick={() => navigate('/dashboard')}
            size="sm"
          />
          
          <GameCard
            title="Yutuqlarim"
            icon={Award}
            color="pink"
            emoji="🏅"
            onClick={() => navigate('/achievements')}
            size="sm"
          />
          
          <GameCard
            title="Statistika"
            icon={TrendingUp}
            color="green"
            emoji="📊"
            onClick={() => navigate('/statistics')}
            size="sm"
          />
          
          <GameCard
            title="Rekordlar"
            icon={Crown}
            color="orange"
            emoji="👑"
            onClick={() => navigate('/records')}
            size="sm"
          />
          
          <GameCard
            title="Varaqalar"
            icon={FileText}
            color="blue"
            emoji="📄"
            onClick={() => navigate('/problem-sheet')}
            size="sm"
          />
        </div>
      </div>

      {/* Achievements teaser */}
      {user && profile && (
        <div className="container px-4 py-6">
          <div className="bg-gradient-to-r from-kids-purple/10 via-kids-pink/10 to-kids-blue/10 rounded-3xl p-6 border border-kids-purple/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <span className="text-2xl">🏅</span>
                So'nggi yutuqlar
              </h2>
              <Button 
                variant="ghost" 
                className="text-kids-purple font-bold"
                onClick={() => navigate('/achievements')}
              >
                Barchasini ko'rish →
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <StarBadge type="trophy" color="gold" size="lg" />
              <StarBadge type="medal" color="silver" size="lg" />
              <StarBadge type="star" color="purple" size="lg" count={profile.best_streak} />
              <StarBadge type="flame" color="gold" size="lg" />
              <StarBadge type="zap" color="blue" size="lg" />
            </div>
          </div>
        </div>
      )}

      {/* Not logged in CTA */}
      {!user && (
        <div className="container px-4 py-8">
          <div className="bg-gradient-to-r from-kids-purple via-kids-pink to-kids-blue rounded-3xl p-8 text-center text-white shadow-2xl">
            <div className="flex justify-center mb-4">
              <Mascot mood="excited" size="lg" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black mb-3">
              O'yin boshlash uchun ro'yxatdan o'ting!
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Yutuqlaringizni saqlang, do'stlar bilan poygalashing va sovg'alar yutib oling! 🎁
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-kids-purple hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 mr-2" />
              Boshlash!
            </Button>
          </div>
        </div>
      )}
    </PageBackground>
  );
};

export default KidsHome;
