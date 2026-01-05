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
  Medal
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
      // Fetch profile
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

      // Fetch today's sessions
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-bounce">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-muted-foreground text-lg font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-bounce-gentle">
            <Star className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Salom! 👋</h1>
          <p className="text-lg text-muted-foreground">
            Mental arifmetika o'yiniga xush kelibsiz!
          </p>
          <Button 
            size="lg" 
            className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary-glow"
            onClick={() => navigate('/auth')}
          >
            <Play className="w-6 h-6 mr-3" />
            Kirish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header with greeting */}
      <div className="pt-8 pb-6 px-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span className="text-2xl">👋</span>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Salom!</p>
            <h1 className="text-2xl font-bold text-foreground">
              {profile?.username || 'Do\'stim'} 
            </h1>
          </div>
        </div>
        <p className="mt-3 text-lg text-muted-foreground">
          Bugun o'ynaymizmi? 🎮
        </p>
      </div>

      {/* Daily Goal - Simple */}
      <div className="px-6 mb-6">
        <Card className="p-5 rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Kunlik maqsad</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {todayStats.solved} / {dailyGoal}
            </span>
          </div>
          <Progress 
            value={dailyProgress} 
            className="h-4 rounded-full"
          />
          {goalComplete && (
            <div className="flex items-center justify-center gap-2 mt-3 text-success">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Barakalla! Maqsad bajarildi! 🎉</span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Play Button */}
      <div className="px-6 mb-8">
        <Button 
          size="lg"
          className="w-full h-20 text-2xl font-bold rounded-3xl shadow-xl hover:shadow-2xl transition-all bg-gradient-to-r from-primary via-primary-glow to-primary hover:scale-[1.02] active:scale-[0.98]"
          onClick={() => navigate('/train')}
        >
          <Play className="w-8 h-8 mr-3 fill-current" />
          O'yinni boshlash
        </Button>
      </div>

      {/* Rewards Preview */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          Bugungi sovg'alar
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {/* XP */}
          <Card className="p-3 rounded-2xl text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">XP</p>
            <p className="font-bold text-primary">{gamification.currentXp}</p>
          </Card>

          {/* Level */}
          <Card className="p-3 rounded-2xl text-center bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-accent/20 flex items-center justify-center mb-2">
              <Medal className="w-5 h-5 text-accent" />
            </div>
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="font-bold text-accent">{gamification.level}</p>
          </Card>

          {/* Streak */}
          <Card className="p-3 rounded-2xl text-center bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-warning/20 flex items-center justify-center mb-2">
              <Flame className="w-5 h-5 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-bold text-warning">{profile?.current_streak || 0}</p>
          </Card>

          {/* Energy */}
          <Card className="p-3 rounded-2xl text-center bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="w-10 h-10 mx-auto rounded-xl bg-success/20 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <p className="text-xs text-muted-foreground">Energiya</p>
            <p className="font-bold text-success">{gamification.energy}</p>
          </Card>
        </div>
      </div>

      {/* Quick Stats - MAX 3 */}
      <div className="px-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Natijalar
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Score */}
          <Card className="p-4 rounded-2xl text-center bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <p className="text-3xl font-bold text-primary">{todayStats.score}</p>
            <p className="text-sm text-muted-foreground mt-1">Ball</p>
          </Card>

          {/* Accuracy */}
          <Card className="p-4 rounded-2xl text-center bg-gradient-to-br from-success/5 to-transparent border-success/10">
            <p className="text-3xl font-bold text-success">{todayStats.accuracy}%</p>
            <p className="text-sm text-muted-foreground mt-1">Aniqlik</p>
          </Card>

          {/* Streak */}
          <Card className="p-4 rounded-2xl text-center bg-gradient-to-br from-warning/5 to-transparent border-warning/10">
            <p className="text-3xl font-bold text-warning">{profile?.best_streak || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Seriya</p>
          </Card>
        </div>
      </div>

      {/* Quick game modes */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold mb-3">O'yin rejimlari</h2>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 rounded-2xl flex flex-col gap-1 bg-gradient-to-br from-success/10 to-success/5 border-success/30 hover:border-success/50"
            onClick={() => navigate('/train')}
          >
            <span className="text-2xl">🎯</span>
            <span className="text-xs font-medium">Oson</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 rounded-2xl flex flex-col gap-1 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 hover:border-accent/50"
            onClick={() => navigate('/train')}
          >
            <span className="text-2xl">⚡</span>
            <span className="text-xs font-medium">Tezlik</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 rounded-2xl flex flex-col gap-1 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50"
            onClick={() => navigate('/mental-arithmetic')}
          >
            <span className="text-2xl">🧮</span>
            <span className="text-xs font-medium">Aralash</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KidsHome;
