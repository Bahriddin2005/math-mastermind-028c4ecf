import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { 
  Play, 
  Trophy, 
  Target, 
  Flame, 
  Zap,
  Star,
  Sparkles,
  Gift,
  Medal,
  Rocket,
  FileText
} from 'lucide-react';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  daily_goal: number;
  current_streak: number;
}

interface TodayStats {
  solved: number;
  accuracy: number;
  score: number;
}

export const KidsHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({ solved: 0, accuracy: 0, score: 0 });
  const [loading, setLoading] = useState(true);

  const gamification = useAdaptiveGamification({
    gameType: 'bonus-challenge',
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today);

      if (sessionsData) {
        const problems = sessionsData.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
        const correct = sessionsData.reduce((sum, s) => sum + (s.correct || 0), 0);
        const score = sessionsData.reduce((sum, s) => sum + (s.score || 0), 0);
        const accuracy = problems > 0 ? Math.round((correct / problems) * 100) : 0;
        
        setTodayStats({ solved: problems, accuracy, score });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const dailyGoal = profile?.daily_goal || 20;
  const dailyProgress = Math.min((todayStats.solved / dailyGoal) * 100, 100);
  const goalComplete = todayStats.solved >= dailyGoal;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500/20 via-background to-orange-400/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center animate-pulse shadow-2xl shadow-violet-500/50">
              <Rocket className="w-10 h-10 text-white animate-bounce" />
            </div>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 opacity-30 blur-xl animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg font-bold bg-gradient-to-r from-violet-500 to-orange-400 bg-clip-text text-transparent">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-orange-400/30 relative overflow-hidden">
        {/* Floating decorations */}
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-60 blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-50 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-40 blur-xl animate-bounce-gentle" />
        
        <div className="text-center space-y-8 max-w-md relative z-10">
          <div className="relative">
            <div className="w-32 h-32 mx-auto rounded-[2rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-violet-500/40 animate-bounce-gentle">
              <Star className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent">
              Salom! 👋
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Mental arifmetika o'yiniga xush kelibsiz!
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-black rounded-2xl shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-500 hover:scale-105 active:scale-95 border-0"
            onClick={() => navigate('/auth')}
          >
            <Play className="w-7 h-7 mr-3 fill-current" />
            Boshlash
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-br from-violet-500/10 via-background to-orange-400/10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-48 h-48 rounded-full bg-gradient-to-br from-orange-400/30 to-yellow-400/20 blur-3xl" />
      
      {/* Header with greeting */}
      <div className="pt-8 pb-4 px-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-xl shadow-violet-500/30">
              <span className="text-3xl">👋</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-background flex items-center justify-center">
              <span className="text-xs">✓</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">Assalomu alaykum!</p>
            <h1 className="text-2xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              {profile?.username || 'Do\'stim'}
            </h1>
          </div>
        </div>
        <p className="mt-4 text-xl font-bold text-foreground/80">
          Bugun o'ynaymizmi? 🎮
        </p>
      </div>

      {/* Daily Goal Card */}
      <div className="px-5 mb-5 relative z-10">
        <Card className="p-5 rounded-[1.5rem] border-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-xl shadow-xl shadow-violet-500/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-2xl" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-foreground">Kunlik maqsad</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg">
              <span className="text-lg font-black text-white">
                {todayStats.solved}/{dailyGoal}
              </span>
            </div>
          </div>
          
          <div className="relative h-5 rounded-full bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${dailyProgress}%` }}
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent" />
          </div>
          
          {goalComplete && (
            <div className="flex items-center justify-center gap-2 mt-4 py-2 rounded-xl bg-gradient-to-r from-green-400/20 to-emerald-400/20">
              <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Barakalla! 🎉</span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Play Button */}
      <div className="px-5 mb-6 relative z-10">
        <Button 
          size="lg"
          className="w-full h-24 text-2xl font-black rounded-[1.5rem] shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-300 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] active:scale-[0.98] border-0 relative overflow-hidden group"
          onClick={() => navigate('/train')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Play className="w-10 h-10 mr-4 fill-current drop-shadow-lg" />
          <span className="drop-shadow-lg">O'yinni boshlash</span>
          <Rocket className="w-8 h-8 ml-4 animate-bounce-gentle" />
        </Button>
      </div>

      {/* Rewards Preview */}
      <div className="px-5 mb-5 relative z-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-orange-500" />
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            Bugungi sovg'alar
          </span>
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <RewardCard 
            icon={<Zap className="w-6 h-6 text-white" />}
            label="XP"
            value={gamification.currentXp}
            gradient="from-violet-500 to-purple-600"
          />
          <RewardCard 
            icon={<Medal className="w-6 h-6 text-white" />}
            label="Level"
            value={gamification.level}
            gradient="from-fuchsia-500 to-pink-600"
          />
          <RewardCard 
            icon={<Flame className="w-6 h-6 text-white" />}
            label="Streak"
            value={profile?.current_streak || 0}
            gradient="from-orange-500 to-red-500"
          />
          <RewardCard 
            icon={<Sparkles className="w-6 h-6 text-white" />}
            label="Energiya"
            value={gamification.energy}
            gradient="from-emerald-500 to-green-600"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mb-5 relative z-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Natijalar
          </span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard 
            value={todayStats.score}
            label="Ball"
            gradient="from-violet-500/20 to-violet-500/5"
            textColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard 
            value={`${todayStats.accuracy}%`}
            label="Aniqlik"
            gradient="from-emerald-500/20 to-emerald-500/5"
            textColor="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard 
            value={profile?.best_streak || 0}
            label="Seriya"
            gradient="from-orange-500/20 to-orange-500/5"
            textColor="text-orange-600 dark:text-orange-400"
          />
        </div>
      </div>

      {/* Game Modes */}
      <div className="px-5 relative z-10">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <Rocket className="w-6 h-6 text-fuchsia-500" />
          <span className="bg-gradient-to-r from-fuchsia-500 to-violet-500 bg-clip-text text-transparent">
            O'yin rejimlari
          </span>
        </h2>
        <div className="grid grid-cols-4 gap-3">
          <GameModeCard 
            emoji="🎯"
            label="Oson"
            gradient="from-emerald-500 to-green-600"
            onClick={() => navigate('/train')}
          />
          <GameModeCard 
            emoji="⚡"
            label="Tezlik"
            gradient="from-orange-500 to-red-500"
            onClick={() => navigate('/train')}
          />
          <GameModeCard 
            emoji="🧮"
            label="Aralash"
            gradient="from-violet-500 to-fuchsia-600"
            onClick={() => navigate('/mental-arithmetic')}
          />
          <GameModeCard 
            emoji="📄"
            label="Varaq"
            gradient="from-blue-500 to-cyan-600"
            onClick={() => navigate('/problem-sheet')}
          />
        </div>
      </div>
    </div>
  );
};

const RewardCard = ({ 
  icon, 
  label, 
  value, 
  gradient 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  gradient: string;
}) => (
  <Card className="p-3 rounded-2xl text-center border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200">
    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-2 shadow-lg`}>
      {icon}
    </div>
    <p className="text-xs text-muted-foreground font-medium">{label}</p>
    <p className="text-lg font-black text-foreground">{value}</p>
  </Card>
);

const StatCard = ({ 
  value, 
  label, 
  gradient,
  textColor 
}: { 
  value: number | string; 
  label: string; 
  gradient: string;
  textColor: string;
}) => (
  <Card className={`p-4 rounded-2xl text-center border-0 bg-gradient-to-br ${gradient} backdrop-blur-sm shadow-lg hover:scale-105 transition-transform duration-200`}>
    <p className={`text-3xl font-black ${textColor}`}>{value}</p>
    <p className="text-sm text-muted-foreground font-medium mt-1">{label}</p>
  </Card>
);

const GameModeCard = ({ 
  emoji, 
  label, 
  gradient,
  onClick 
}: { 
  emoji: string; 
  label: string; 
  gradient: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-0`}
  >
    <span className="text-3xl drop-shadow-lg">{emoji}</span>
    <span className="text-sm font-bold text-white drop-shadow-lg">{label}</span>
  </button>
);

export default KidsHome;
