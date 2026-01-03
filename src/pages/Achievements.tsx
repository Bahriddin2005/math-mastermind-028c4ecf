import { useState, useEffect } from 'react';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  Medal, 
  Crown,
  Zap,
  Award,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  type: 'problems' | 'streak' | 'score';
  icon: React.ReactNode;
  color: string;
}

const achievements: Achievement[] = [
  // Problems achievements
  { id: 'first10', name: 'Birinchi qadam', description: '10 ta misol yechildi!', requirement: 10, type: 'problems', icon: <Target className="h-6 w-6" />, color: 'from-blue-500 to-cyan-500' },
  { id: 'solver50', name: "Faol o'quvchi", description: '50 ta misol yechildi!', requirement: 50, type: 'problems', icon: <Zap className="h-6 w-6" />, color: 'from-green-500 to-emerald-500' },
  { id: 'solver100', name: 'Yuz misol', description: '100 ta misol yechildi!', requirement: 100, type: 'problems', icon: <Star className="h-6 w-6" />, color: 'from-yellow-500 to-amber-500' },
  { id: 'solver500', name: 'Matematik', description: '500 ta misol yechildi!', requirement: 500, type: 'problems', icon: <Medal className="h-6 w-6" />, color: 'from-purple-500 to-violet-500' },
  { id: 'solver1000', name: 'Usta', description: '1000 ta misol yechildi!', requirement: 1000, type: 'problems', icon: <Crown className="h-6 w-6" />, color: 'from-orange-500 to-red-500' },
  
  // Streak achievements
  { id: 'streak5', name: "Boshlang'ich seriya", description: "5 ta ketma-ket to'g'ri!", requirement: 5, type: 'streak', icon: <Flame className="h-6 w-6" />, color: 'from-orange-400 to-orange-600' },
  { id: 'streak10', name: "O't seriyasi", description: "10 ta ketma-ket to'g'ri!", requirement: 10, type: 'streak', icon: <Flame className="h-6 w-6" />, color: 'from-red-400 to-red-600' },
  { id: 'streak25', name: 'Ajoyib seriya', description: "25 ta ketma-ket to'g'ri!", requirement: 25, type: 'streak', icon: <Flame className="h-6 w-6" />, color: 'from-pink-500 to-rose-500' },
  { id: 'streak50', name: 'Legenda', description: "50 ta ketma-ket to'g'ri!", requirement: 50, type: 'streak', icon: <Award className="h-6 w-6" />, color: 'from-fuchsia-500 to-purple-600' },
  
  // Score achievements
  { id: 'score100', name: 'Yuz ball', description: "100 ball to'plandi!", requirement: 100, type: 'score', icon: <Trophy className="h-6 w-6" />, color: 'from-amber-400 to-yellow-500' },
  { id: 'score500', name: 'Yuqori ball', description: "500 ball to'plandi!", requirement: 500, type: 'score', icon: <Trophy className="h-6 w-6" />, color: 'from-amber-500 to-orange-500' },
  { id: 'score1000', name: 'Ming ball', description: "1000 ball to'plandi!", requirement: 1000, type: 'score', icon: <Trophy className="h-6 w-6" />, color: 'from-amber-600 to-red-500' },
];

const Achievements = () => {
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [profile, setProfile] = useState<{
    total_problems_solved: number;
    best_streak: number;
    total_score: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('total_problems_solved, best_streak, total_score')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const getCurrentValue = (type: 'problems' | 'streak' | 'score'): number => {
    if (!profile) return 0;
    switch (type) {
      case 'problems': return profile.total_problems_solved || 0;
      case 'streak': return profile.best_streak || 0;
      case 'score': return profile.total_score || 0;
    }
  };

  const getProgress = (achievement: Achievement): number => {
    const current = getCurrentValue(achievement.type);
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  const isUnlocked = (achievement: Achievement): boolean => {
    return getCurrentValue(achievement.type) >= achievement.requirement;
  };

  const unlockedCount = achievements.filter(a => isUnlocked(a)).length;

  const groupedAchievements = {
    problems: achievements.filter(a => a.type === 'problems'),
    streak: achievements.filter(a => a.type === 'streak'),
    score: achievements.filter(a => a.type === 'score'),
  };

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-3 sm:px-6 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in">
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 mb-2">
              <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              <span className="text-gradient-primary">Yutuqlar</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              O'z yutuqlaringizni kuzating va yangi maqsadlarga erishing
            </p>
          </div>

          {/* Stats Summary */}
          <Card className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-lg border-border/50">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-primary/10">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">{unlockedCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Ochilgan</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <div className="text-2xl sm:text-3xl font-bold">{achievements.length - unlockedCount}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Qolgan</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-amber-500/10">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-500">{profile?.total_problems_solved || 0}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Misollar</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-orange-500/10">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-500">{profile?.best_streak || 0}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Eng yaxshi seriya</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Categories */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Problems Achievements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg sm:text-xl font-semibold">Misollar bo'yicha</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedAchievements.problems.filter(a => isUnlocked(a)).length}/{groupedAchievements.problems.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:gap-4">
                  {groupedAchievements.problems.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      progress={getProgress(achievement)}
                      currentValue={getCurrentValue(achievement.type)}
                      isUnlocked={isUnlocked(achievement)}
                    />
                  ))}
                </div>
              </div>

              {/* Streak Achievements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-lg sm:text-xl font-semibold">Seriya bo'yicha</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedAchievements.streak.filter(a => isUnlocked(a)).length}/{groupedAchievements.streak.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:gap-4">
                  {groupedAchievements.streak.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      progress={getProgress(achievement)}
                      currentValue={getCurrentValue(achievement.type)}
                      isUnlocked={isUnlocked(achievement)}
                    />
                  ))}
                </div>
              </div>

              {/* Score Achievements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg sm:text-xl font-semibold">Ball bo'yicha</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedAchievements.score.filter(a => isUnlocked(a)).length}/{groupedAchievements.score.length}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:gap-4">
                  {groupedAchievements.score.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      progress={getProgress(achievement)}
                      currentValue={getCurrentValue(achievement.type)}
                      isUnlocked={isUnlocked(achievement)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageBackground>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  progress: number;
  currentValue: number;
  isUnlocked: boolean;
}

const AchievementCard = ({ achievement, progress, currentValue, isUnlocked }: AchievementCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      isUnlocked 
        ? 'bg-gradient-to-br from-card to-card/80 border-primary/30 shadow-lg' 
        : 'bg-card/50 border-border/30 opacity-80'
    }`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`relative p-3 sm:p-4 rounded-xl ${
            isUnlocked 
              ? `bg-gradient-to-br ${achievement.color} text-white shadow-lg` 
              : 'bg-muted text-muted-foreground'
          }`}>
            {achievement.icon}
            {isUnlocked && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle2 className="h-4 w-4 text-white bg-green-500 rounded-full" />
              </div>
            )}
            {!isUnlocked && (
              <div className="absolute -top-1 -right-1">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-sm sm:text-base ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.name}
              </h3>
              {isUnlocked && (
                <Sparkles className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              {achievement.description}
            </p>
            
            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {currentValue} / {achievement.requirement}
                </span>
                <span className={isUnlocked ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className={`h-2 ${isUnlocked ? '' : 'opacity-50'}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Unlocked glow effect */}
      {isUnlocked && (
        <div className={`absolute inset-0 bg-gradient-to-r ${achievement.color} opacity-5 pointer-events-none`} />
      )}
    </Card>
  );
};

export default Achievements;
