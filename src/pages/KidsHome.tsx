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
  Trophy,
  BookOpen,
  Target,
  Flame,
  Star,
  Zap,
  Play,
  Crown,
  Award,
  Users,
  Calendar,
  TrendingUp,
  Gift,
  FileText,
} from 'lucide-react';

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

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-kids-purple/10 via-kids-pink/10 to-kids-blue/10" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-kids-yellow/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-kids-pink/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-kids-blue/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Floating decorations */}
        <div className="absolute top-20 right-8 text-4xl animate-bounce-soft">⭐</div>
        <div className="absolute top-32 left-12 text-3xl animate-bounce-soft" style={{ animationDelay: '0.3s' }}>🎮</div>
        <div className="absolute bottom-20 right-16 text-3xl animate-bounce-soft" style={{ animationDelay: '0.6s' }}>🏆</div>

        <div className="container px-4 py-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
            {/* Mascot */}
            <div className="flex-shrink-0">
              <Mascot 
                mood={mascotMood} 
                size="xl" 
                message={mascotMessage}
                animate 
              />
            </div>

            {/* Welcome content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge className="mb-3 bg-gradient-to-r from-kids-purple to-kids-pink text-white border-0 px-4 py-1.5 text-sm font-bold shadow-lg animate-bounce-soft">
                <Sparkles className="w-4 h-4 mr-1.5" />
                {getGreeting()}!
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black mb-3">
                <span className="bg-gradient-to-r from-kids-purple via-kids-pink to-kids-blue bg-clip-text text-transparent">
                  {user ? `Salom, ${profile?.username || 'Do\'stim'}!` : 'Xush kelibsiz!'}
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6 max-w-lg mx-auto lg:mx-0">
                Bugun yangi yutuqlarga erishish uchun ajoyib kun! 
                <span className="text-kids-yellow font-bold"> O'ynaymizmi? 🚀</span>
              </p>

              {/* Quick stats for logged in users */}
              {user && profile && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-kids-yellow/20 to-kids-orange/20 rounded-full px-4 py-2 border border-kids-yellow/30">
                    <Crown className="w-5 h-5 text-kids-yellow" />
                    <span className="font-bold">Level {level}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-kids-purple/20 to-kids-pink/20 rounded-full px-4 py-2 border border-kids-purple/30">
                    <Star className="w-5 h-5 text-kids-purple fill-kids-purple" />
                    <span className="font-bold">{profile.total_score.toLocaleString()} ball</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-kids-orange/20 to-kids-red/20 rounded-full px-4 py-2 border border-kids-orange/30">
                    <Flame className="w-5 h-5 text-kids-orange" />
                    <span className="font-bold">{profile.current_streak} kun</span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress ring */}
            {user && profile && (
              <div className="flex-shrink-0 text-center">
                <div className="relative">
                  <ProgressRing 
                    progress={dailyGoalProgress} 
                    size="lg" 
                    color={dailyGoalProgress >= 100 ? 'green' : 'purple'}
                    showLabel
                    label="Kunlik maqsad"
                  />
                  {dailyGoalProgress >= 100 && (
                    <div className="absolute -top-2 -right-2">
                      <StarBadge type="star" color="gold" size="sm" animated />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {todaySolved}/{profile.daily_goal} masala
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Cards */}
      <div className="container px-4 py-8">
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
            onClick={() => navigate('/challenge-stats')}
            size="lg"
          />
          
          <GameCard
            title="Tez hisoblash"
            description="Aqliy matematikada o'z kuchingizni sinab ko'ring!"
            icon={Zap}
            color="blue"
            onClick={() => navigate('/mental-arithmetic')}
            size="lg"
          />
          
          <GameCard
            title="Video darslar"
            description="Yangi usullarni o'rganing va mahoratni oshiring!"
            icon={BookOpen}
            color="green"
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
            onClick={() => navigate('/dashboard')}
            size="sm"
          />
          
          <GameCard
            title="Yutuqlarim"
            icon={Award}
            color="pink"
            onClick={() => navigate('/achievements')}
            size="sm"
          />
          
          <GameCard
            title="Statistika"
            icon={TrendingUp}
            color="green"
            onClick={() => navigate('/statistics')}
            size="sm"
          />
          
          <GameCard
            title="Rekordlar"
            icon={Crown}
            color="orange"
            onClick={() => navigate('/records')}
            size="sm"
          />
          
          <GameCard
            title="Varaqalar"
            icon={FileText}
            color="blue"
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
