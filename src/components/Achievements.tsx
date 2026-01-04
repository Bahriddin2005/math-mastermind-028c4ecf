import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { 
  Trophy, 
  Target, 
  Flame, 
  Zap, 
  Star, 
  Medal,
  Award,
  Crown,
  Rocket,
  Brain,
  LucideIcon,
  Lock,
  Sparkles,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  glowColor: string;
  requirement: number;
  type: 'problems' | 'streak' | 'score' | 'games' | 'level' | 'xp';
}

const achievements: Achievement[] = [
  // Problems solved
  { id: 'first10', name: 'Birinchi qadam', description: '10 ta misol yech', icon: Target, color: 'text-primary', bgColor: 'bg-primary/10', glowColor: 'shadow-glow', requirement: 10, type: 'problems' },
  { id: 'solver50', name: 'Faol o\'quvchi', description: '50 ta misol yech', icon: Zap, color: 'text-accent', bgColor: 'bg-accent/10', glowColor: 'shadow-accent-glow', requirement: 50, type: 'problems' },
  { id: 'solver100', name: 'Yuz misol', description: '100 ta misol yech', icon: Star, color: 'text-warning', bgColor: 'bg-warning/10', glowColor: '', requirement: 100, type: 'problems' },
  { id: 'solver500', name: 'Matematik', description: '500 ta misol yech', icon: Brain, color: 'text-success', bgColor: 'bg-success/10', glowColor: '', requirement: 500, type: 'problems' },
  { id: 'solver1000', name: 'Usta', description: '1000 ta misol yech', icon: Crown, color: 'text-primary', bgColor: 'gradient-primary', glowColor: 'shadow-glow', requirement: 1000, type: 'problems' },
  
  // Streak
  { id: 'streak5', name: 'Boshlang\'ich seriya', description: '5 ta ketma-ket to\'g\'ri', icon: Flame, color: 'text-accent', bgColor: 'bg-accent/10', glowColor: '', requirement: 5, type: 'streak' },
  { id: 'streak10', name: 'O\'t seriyasi', description: '10 ta ketma-ket to\'g\'ri', icon: Flame, color: 'text-warning', bgColor: 'bg-warning/10', glowColor: '', requirement: 10, type: 'streak' },
  { id: 'streak25', name: 'Ajoyib seriya', description: '25 ta ketma-ket to\'g\'ri', icon: Rocket, color: 'text-success', bgColor: 'bg-success/10', glowColor: '', requirement: 25, type: 'streak' },
  { id: 'streak50', name: 'Legenda', description: '50 ta ketma-ket to\'g\'ri', icon: Crown, color: 'text-primary', bgColor: 'gradient-primary', glowColor: 'shadow-glow', requirement: 50, type: 'streak' },
  
  // Score
  { id: 'score100', name: 'Yuz ball', description: '100 ball to\'pla', icon: Medal, color: 'text-primary', bgColor: 'bg-primary/10', glowColor: '', requirement: 100, type: 'score' },
  { id: 'score500', name: 'Yuqori ball', description: '500 ball to\'pla', icon: Award, color: 'text-accent', bgColor: 'bg-accent/10', glowColor: '', requirement: 500, type: 'score' },
  { id: 'score1000', name: 'Ming ball', description: '1000 ball to\'pla', icon: Trophy, color: 'text-warning', bgColor: 'bg-warning/20', glowColor: '', requirement: 1000, type: 'score' },

  // Level achievements (NEW)
  { id: 'level5', name: 'Yangi boshlovchi', description: '5-levelga yetish', icon: Star, color: 'text-blue-500', bgColor: 'bg-blue-500/10', glowColor: '', requirement: 5, type: 'level' },
  { id: 'level10', name: 'Rivojlanuvchi', description: '10-levelga yetish', icon: Star, color: 'text-purple-500', bgColor: 'bg-purple-500/10', glowColor: '', requirement: 10, type: 'level' },
  { id: 'level25', name: 'Tajribali', description: '25-levelga yetish', icon: Crown, color: 'text-amber-500', bgColor: 'bg-amber-500/10', glowColor: 'shadow-glow', requirement: 25, type: 'level' },
  { id: 'level50', name: 'Professional', description: '50-levelga yetish', icon: Crown, color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-pink-500/20 to-purple-500/20', glowColor: 'shadow-glow', requirement: 50, type: 'level' },

  // XP achievements (NEW)
  { id: 'xp1000', name: 'Birinchi ming', description: '1000 XP to\'plash', icon: Zap, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', glowColor: '', requirement: 1000, type: 'xp' },
  { id: 'xp5000', name: 'XP yig\'uvchi', description: '5000 XP to\'plash', icon: Zap, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', glowColor: '', requirement: 5000, type: 'xp' },
  { id: 'xp10000', name: 'XP ustasi', description: '10,000 XP to\'plash', icon: Sparkles, color: 'text-violet-500', bgColor: 'bg-violet-500/10', glowColor: 'shadow-glow', requirement: 10000, type: 'xp' },
  { id: 'xp50000', name: 'XP imperatori', description: '50,000 XP to\'plash', icon: Crown, color: 'text-rose-500', bgColor: 'bg-gradient-to-br from-rose-500/20 to-orange-500/20', glowColor: 'shadow-glow', requirement: 50000, type: 'xp' },
];

interface AchievementsProps {
  totalProblems: number;
  bestStreak: number;
  totalScore: number;
  totalGames: number;
  level?: number;
  totalXp?: number;
}

export const Achievements = ({
  totalProblems,
  bestStreak,
  totalScore,
  totalGames,
  level = 1,
  totalXp = 0,
}: AchievementsProps) => {
  const checkAchievement = (achievement: Achievement): boolean => {
    switch (achievement.type) {
      case 'problems':
        return totalProblems >= achievement.requirement;
      case 'streak':
        return bestStreak >= achievement.requirement;
      case 'score':
        return totalScore >= achievement.requirement;
      case 'games':
        return totalGames >= achievement.requirement;
      case 'level':
        return level >= achievement.requirement;
      case 'xp':
        return totalXp >= achievement.requirement;
      default:
        return false;
    }
  };

  const getProgress = (achievement: Achievement): number => {
    let current = 0;
    switch (achievement.type) {
      case 'problems':
        current = totalProblems;
        break;
      case 'streak':
        current = bestStreak;
        break;
      case 'score':
        current = totalScore;
        break;
      case 'games':
        current = totalGames;
        break;
      case 'level':
        current = level;
        break;
      case 'xp':
        current = totalXp;
        break;
    }
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  const earnedCount = achievements.filter(a => checkAchievement(a)).length;

  return (
    <Card className="border-border/40 dark:border-border/30 shadow-md dark:shadow-xl overflow-hidden opacity-0 animate-slide-up backdrop-blur-sm" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-warning/10 via-accent/5 to-transparent dark:from-warning/15 dark:via-accent/10 dark:to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-warning/20 dark:bg-warning/30 flex items-center justify-center border border-warning/20 dark:border-warning/30">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
            </div>
            <div>
              <span className="text-base sm:text-lg">Yutuqlar</span>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-normal mt-0.5">
                Mukofotlarni yig'ing
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 dark:bg-secondary/30 px-2 sm:px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-warning" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {earnedCount}
                <span className="text-muted-foreground font-normal">/{achievements.length}</span>
              </span>
            </div>
            <Link to="/achievements">
              <Button variant="outline" size="sm" className="text-[10px] sm:text-xs h-6 sm:h-7 px-2 sm:px-3 border-border/50 dark:border-border/30">
                Barchasi
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 sm:mt-4">
          <Progress value={(earnedCount / achievements.length) * 100} className="h-1.5 sm:h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 sm:pt-4 px-2 sm:px-3 md:px-6 pb-3 sm:pb-4">
        <AchievementGrid 
          achievements={achievements}
          checkAchievement={checkAchievement}
          getProgress={getProgress}
        />
      </CardContent>
    </Card>
  );
};

interface AchievementGridProps {
  achievements: Achievement[];
  checkAchievement: (a: Achievement) => boolean;
  getProgress: (a: Achievement) => number;
}

const AchievementGrid = ({ achievements, checkAchievement, getProgress }: AchievementGridProps) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [selectedProgress, setSelectedProgress] = useState<number>(0);
  const [isEarnedSelected, setIsEarnedSelected] = useState<boolean>(false);

  const handleSelect = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setSelectedProgress(getProgress(achievement));
    setIsEarnedSelected(checkAchievement(achievement));
  };

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 md:gap-3">
        {achievements.map((achievement, index) => {
          const isEarned = checkAchievement(achievement);
          const progress = getProgress(achievement);
          const Icon = achievement.icon;
          
          return (
            <div
              key={achievement.id}
              className="relative group opacity-0 animate-slide-up"
              style={{ animationDelay: `${400 + index * 30}ms`, animationFillMode: 'forwards' }}
              onClick={() => handleSelect(achievement)}
            >
              <div
                className={cn(
                  'aspect-square rounded-lg sm:rounded-xl md:rounded-2xl flex flex-col items-center justify-center p-1 sm:p-1.5 md:p-2 transition-all duration-300 border-2 cursor-pointer active:scale-95',
                  isEarned
                    ? `${achievement.bgColor} border-transparent ${achievement.glowColor} hover:scale-110 dark:border-white/10`
                    : 'bg-secondary/30 dark:bg-secondary/20 border-dashed border-border/50 dark:border-border/30 grayscale opacity-60 hover:opacity-80 dark:opacity-50 dark:hover:opacity-70'
                )}
              >
                {isEarned ? (
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 ${achievement.color}`} />
                ) : (
                  <div className="relative">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-7 md:w-7 text-muted-foreground/50 dark:text-muted-foreground/40" />
                    <Lock className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 absolute -bottom-0.5 -right-0.5 text-muted-foreground dark:text-muted-foreground/60" />
                  </div>
                )}
                
                {/* Progress indicator for locked */}
                {!isEarned && progress > 0 && (
                  <div className="absolute bottom-0.5 left-0.5 right-0.5 sm:bottom-1 sm:left-1 sm:right-1 md:bottom-1.5 md:left-1.5 md:right-1.5">
                    <div className="h-0.5 sm:h-0.5 md:h-1 bg-secondary dark:bg-secondary/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/50 dark:bg-primary/60 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Desktop Tooltip - hidden on mobile */}
              <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 bg-popover dark:bg-card text-popover-foreground text-xs rounded-xl shadow-xl dark:shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20 border border-border dark:border-border/50 min-w-[140px]">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${isEarned ? achievement.color : 'text-muted-foreground'}`} />
                  <p className="font-bold">{achievement.name}</p>
                </div>
                <p className="text-muted-foreground">{achievement.description}</p>
                {!isEarned && (
                  <div className="mt-2 pt-2 border-t border-border/50 dark:border-border/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Jarayon</span>
                      <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                    </div>
                  </div>
                )}
                {isEarned && (
                  <div className="mt-2 pt-2 border-t border-border/50 dark:border-border/30 flex items-center gap-1 text-success">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-semibold">Qo'lga kiritildi!</span>
                  </div>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover dark:border-t-card" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Modal */}
      {selectedAchievement && (
        <div 
          className="sm:hidden fixed inset-0 z-50 flex items-end justify-center bg-background/80 dark:bg-background/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="w-full bg-card dark:bg-card/95 border-t border-border dark:border-border/50 rounded-t-2xl sm:rounded-t-3xl p-5 sm:p-6 animate-slide-up shadow-lg dark:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={cn(
                  'h-11 w-11 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center',
                  isEarnedSelected ? selectedAchievement.bgColor : 'bg-secondary/50 dark:bg-secondary/30'
                )}>
                  <selectedAchievement.icon className={cn(
                    'h-5 w-5 sm:h-6 sm:w-6',
                    isEarnedSelected ? selectedAchievement.color : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground">{selectedAchievement.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedAchievement.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAchievement(null)}
                className="p-2 rounded-full bg-secondary dark:bg-secondary/50 hover:bg-secondary/80 dark:hover:bg-secondary/70 transition-colors"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>

            {isEarnedSelected ? (
              <div className="flex items-center gap-2 p-3 bg-success/10 dark:bg-success/15 rounded-lg sm:rounded-xl text-success">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">Qo'lga kiritildi!</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jarayon</span>
                  <span className="font-bold text-primary">{Math.round(selectedProgress)}%</span>
                </div>
                <Progress value={selectedProgress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};