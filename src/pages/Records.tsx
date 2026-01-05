import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Trophy,
  Flame,
  Target,
  Clock,
  Zap,
  Crown,
  Medal,
  Star,
  Award
} from 'lucide-react';

interface Profile {
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
}

interface Records {
  highestScore: number;
  bestStreak: number;
  bestAccuracy: number;
  fastestTime: number;
  totalProblems: number;
  totalGames: number;
}

const Records = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Records>({
    highestScore: 0,
    bestStreak: 0,
    bestAccuracy: 0,
    fastestTime: 0,
    totalProblems: 0,
    totalGames: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_score, total_problems_solved, best_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch sessions for records
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (sessionsData && sessionsData.length > 0) {
        const highestScore = sessionsData.reduce((max, s) => Math.max(max, s.score || 0), 0);
        const bestStreak = sessionsData.reduce((max, s) => Math.max(max, s.best_streak || 0), 0);
        
        // Best accuracy (min 5 problems)
        const validSessions = sessionsData.filter(s => (s.correct || 0) + (s.incorrect || 0) >= 5);
        let bestAccuracy = 0;
        validSessions.forEach(s => {
          const total = (s.correct || 0) + (s.incorrect || 0);
          const acc = Math.round((s.correct || 0) / total * 100);
          if (acc > bestAccuracy) bestAccuracy = acc;
        });

        // Fastest average time (min 5 problems)
        let fastestTime = 999;
        validSessions.forEach(s => {
          const total = (s.correct || 0) + (s.incorrect || 0);
          const avgTime = (s.total_time || 0) / total;
          if (avgTime < fastestTime && avgTime > 0) fastestTime = avgTime;
        });

        setRecords({
          highestScore,
          bestStreak: profileData?.best_streak || bestStreak,
          bestAccuracy,
          fastestTime: fastestTime === 999 ? 0 : Math.round(fastestTime * 10) / 10,
          totalProblems: profileData?.total_problems_solved || 0,
          totalGames: sessionsData.length
        });
      } else if (profileData) {
        setRecords({
          ...records,
          bestStreak: profileData.best_streak || 0,
          totalProblems: profileData.total_problems_solved || 0
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const recordItems = [
    {
      icon: Crown,
      label: "Eng yuqori ball",
      value: records.highestScore,
      color: "warning",
      emoji: "👑"
    },
    {
      icon: Flame,
      label: "Eng uzun seriya",
      value: records.bestStreak,
      color: "accent",
      emoji: "🔥"
    },
    {
      icon: Target,
      label: "Eng yaxshi aniqlik",
      value: `${records.bestAccuracy}%`,
      color: "success",
      emoji: "🎯"
    },
    {
      icon: Clock,
      label: "Eng tez javob",
      value: records.fastestTime > 0 ? `${records.fastestTime}s` : "-",
      color: "primary",
      emoji: "⚡"
    },
    {
      icon: Zap,
      label: "Jami masalalar",
      value: records.totalProblems,
      color: "primary",
      emoji: "📊"
    },
    {
      icon: Trophy,
      label: "Jami o'yinlar",
      value: records.totalGames,
      color: "accent",
      emoji: "🎮"
    }
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-warning/5 via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            Rekordlar
          </h1>
        </div>
      </div>

      {/* Trophy Banner */}
      <div className="p-6">
        <Card className="p-6 rounded-3xl bg-gradient-to-br from-warning/20 via-accent/10 to-primary/10 border-warning/30 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-warning to-accent flex items-center justify-center mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Sizning rekordlaringiz!</h2>
          <p className="text-muted-foreground">Eng yaxshi natijalaringiz shu yerda 🏆</p>
        </Card>
      </div>

      {/* Records Grid */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          {recordItems.map((item, index) => (
            <Card 
              key={index}
              className={`p-4 rounded-2xl bg-gradient-to-br from-${item.color}/10 to-${item.color}/5 border-${item.color}/20 transition-transform hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-${item.color}/20 flex items-center justify-center`}>
                  <span className="text-2xl">{item.emoji}</span>
                </div>
              </div>
              <p className={`text-3xl font-bold text-${item.color}`}>{item.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Medals Section */}
      <div className="p-6 mt-4">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-accent" />
          Yutuqlar
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <MedalCard 
            emoji="🥇" 
            label="Oltin" 
            unlocked={records.highestScore >= 1000}
            requirement="1000+ ball"
          />
          <MedalCard 
            emoji="🥈" 
            label="Kumush" 
            unlocked={records.bestStreak >= 10}
            requirement="10+ seriya"
          />
          <MedalCard 
            emoji="🥉" 
            label="Bronza" 
            unlocked={records.totalGames >= 10}
            requirement="10+ o'yin"
          />
          <MedalCard 
            emoji="⭐" 
            label="Yulduz" 
            unlocked={records.bestAccuracy >= 90}
            requirement="90%+ aniqlik"
          />
          <MedalCard 
            emoji="💎" 
            label="Olmos" 
            unlocked={records.totalProblems >= 500}
            requirement="500+ masala"
          />
          <MedalCard 
            emoji="🚀" 
            label="Raketa" 
            unlocked={records.fastestTime > 0 && records.fastestTime <= 2}
            requirement="2s tezlik"
          />
        </div>
      </div>
    </div>
  );
};

const MedalCard = ({ emoji, label, unlocked, requirement }: { 
  emoji: string; 
  label: string; 
  unlocked: boolean;
  requirement: string;
}) => (
  <Card className={`p-4 rounded-2xl text-center transition-all ${
    unlocked 
      ? 'bg-gradient-to-br from-warning/20 to-accent/10 border-warning/30 shadow-md' 
      : 'bg-muted/50 border-muted/30 opacity-60'
  }`}>
    <span className={`text-3xl ${unlocked ? '' : 'grayscale'}`}>{emoji}</span>
    <p className="font-semibold text-sm mt-2">{label}</p>
    <p className="text-xs text-muted-foreground mt-1">{requirement}</p>
  </Card>
);

export default Records;
