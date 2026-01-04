import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageBackground } from "@/components/layout/PageBackground";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useGameCurrency } from "@/hooks/useGameCurrency";
import { useSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { GameLeaderboard } from "@/components/GameLeaderboard";
import { 
  Coins, Heart, Star, Trophy, ShoppingBag, 
  Play, Lock, Crown, Zap, Target, Gift, Package
} from "lucide-react";

interface GameLevel {
  id: string;
  level_number: number;
  name: string;
  description: string;
  required_xp: number;
  coin_reward: number;
  difficulty: string;
  problem_count: number;
  icon: string;
}

interface UserProgress {
  level_id: string;
  stars_earned: number;
  best_score: number;
  completed_at: string | null;
}

const GameHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coins, lives, maxLives, loading: currencyLoading } = useGameCurrency();
  const { soundEnabled, toggleSound } = useSound();
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserProgress>>(new Map());
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load levels
      const { data: levelsData } = await supabase
        .from('game_levels')
        .select('*')
        .eq('is_active', true)
        .order('level_number');

      if (levelsData) {
        setLevels(levelsData);
      }

      if (user) {
        // Load user progress
        const { data: progressData } = await supabase
          .from('user_level_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressData) {
          const progressMap = new Map<string, UserProgress>();
          progressData.forEach(p => {
            progressMap.set(p.level_id, p);
          });
          setUserProgress(progressMap);
        }

        // Load total XP from gamification
        const { data: gamificationData } = await supabase
          .from('user_gamification')
          .select('total_xp')
          .eq('user_id', user.id)
          .maybeSingle();

        if (gamificationData) {
          setTotalXp(gamificationData.total_xp);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLevelUnlocked = (level: GameLevel) => {
    return totalXp >= level.required_xp;
  };

  const getLevelProgress = (levelId: string) => {
    return userProgress.get(levelId);
  };

  const getStarsDisplay = (stars: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
      />
    ));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-emerald-500 to-green-600';
      case 'medium': return 'from-amber-500 to-orange-600';
      case 'hard': return 'from-rose-500 to-red-600';
      default: return 'from-blue-500 to-indigo-600';
    }
  };

  const currentLevel = levels.findIndex(l => !isLevelUnlocked(l)) || levels.length;
  const nextLevel = levels[currentLevel];
  const progressToNext = nextLevel 
    ? Math.min(100, (totalXp / nextLevel.required_xp) * 100)
    : 100;

  return (
    <PageBackground>
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header Stats Bar */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-0 text-white overflow-hidden">
          <div className="p-4">
            {/* Top row - Coins, Lives, Settings */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Coins */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Coins className="h-5 w-5 text-yellow-300" />
                  <span className="font-bold">{coins.toLocaleString()}</span>
                </div>

                {/* Lives */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Heart className="h-5 w-5 text-red-400 fill-red-400" />
                  <span className="font-bold">{lives}/{maxLives}</span>
                </div>
              </div>

              {/* Shop Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-white/20 hover:bg-white/30 text-white rounded-full"
                onClick={() => navigate('/game-shop')}
              >
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </div>

            {/* Level Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-300" />
                  <span>Level {currentLevel}</span>
                </div>
                <span className="text-white/80">{totalXp} XP</span>
              </div>
              <Progress value={progressToNext} className="h-3 bg-white/20" />
              {nextLevel && (
                <p className="text-xs text-white/70 text-center">
                  {nextLevel.required_xp - totalXp} XP kerak keyingi levelga
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Button 
            variant="outline" 
            className="h-auto py-3 flex-col gap-1.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800 hover:border-amber-400"
            onClick={() => navigate('/game-shop')}
          >
            <Gift className="h-5 w-5 text-amber-600" />
            <span className="text-xs font-medium">Do'kon</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-3 flex-col gap-1.5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400"
            onClick={() => navigate('/game-inventory')}
          >
            <Package className="h-5 w-5 text-purple-600" />
            <span className="text-xs font-medium">Inventar</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-3 flex-col gap-1.5 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
            onClick={() => navigate('/achievements')}
          >
            <Trophy className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-medium">Yutuqlar</span>
          </Button>
        </div>

        {/* Levels Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            O'yin Levellari
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {levels.map((level) => {
              const unlocked = isLevelUnlocked(level);
              const progress = getLevelProgress(level.id);
              const completed = progress?.completed_at != null;

              return (
                <Card 
                  key={level.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    unlocked 
                      ? 'cursor-pointer hover:scale-105 hover:shadow-lg' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => unlocked && navigate(`/game-play/${level.id}`)}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(level.difficulty)} opacity-10`} />
                  
                  <div className="relative p-4">
                    {/* Level number badge */}
                    <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${getDifficultyColor(level.difficulty)} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                      {level.level_number}
                    </div>

                    {/* Lock overlay */}
                    {!unlocked && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="text-3xl">{level.icon}</div>
                      <div>
                        <h3 className="font-semibold text-sm">{level.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {level.description}
                        </p>
                      </div>

                      {/* Stars or XP requirement */}
                      {unlocked ? (
                        <div className="flex items-center gap-1">
                          {getStarsDisplay(progress?.stars_earned || 0)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          <span>{level.required_xp} XP</span>
                        </div>
                      )}

                      {/* Reward badge */}
                      <div className="flex items-center gap-1 text-xs">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span className="text-muted-foreground">+{level.coin_reward}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* No levels message */}
        {levels.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Levellar yuklanmoqda...</h3>
            <p className="text-sm text-muted-foreground">
              Tez orada yangi o'yin levellari qo'shiladi!
            </p>
          </Card>
        )}

        {/* Leaderboard */}
        <div className="mt-6">
          <GameLeaderboard compact />
        </div>
      </div>
    </PageBackground>
  );
};

export default GameHub;
