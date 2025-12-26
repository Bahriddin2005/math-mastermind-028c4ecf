import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
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
  Sparkles
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
  type: 'problems' | 'streak' | 'score' | 'games';
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
];

interface AchievementsProps {
  totalProblems: number;
  bestStreak: number;
  totalScore: number;
  totalGames: number;
}

export const Achievements = ({
  totalProblems,
  bestStreak,
  totalScore,
  totalGames,
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
    }
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  const earnedCount = achievements.filter(a => checkAchievement(a)).length;

  return (
    <Card className="border-border/40 shadow-md overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-4 bg-gradient-to-r from-warning/10 via-accent/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <span className="text-lg">Yutuqlar</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Mukofotlarni yig'ing
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" />
            <span className="text-sm font-bold text-foreground">
              {earnedCount}
              <span className="text-muted-foreground font-normal">/{achievements.length}</span>
            </span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <Progress value={(earnedCount / achievements.length) * 100} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {achievements.map((achievement, index) => {
            const isEarned = checkAchievement(achievement);
            const progress = getProgress(achievement);
            const Icon = achievement.icon;
            
            return (
              <div
                key={achievement.id}
                className="relative group opacity-0 animate-slide-up"
                style={{ animationDelay: `${400 + index * 30}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className={cn(
                    'aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 border-2',
                    isEarned
                      ? `${achievement.bgColor} border-transparent ${achievement.glowColor} hover:scale-110 cursor-pointer`
                      : 'bg-secondary/30 border-dashed border-border/50 grayscale opacity-60 hover:opacity-80'
                  )}
                >
                  {isEarned ? (
                    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${achievement.color}`} />
                  ) : (
                    <div className="relative">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground/50" />
                      <Lock className="h-3 w-3 absolute -bottom-1 -right-1 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Progress indicator for locked */}
                  {!isEarned && progress > 0 && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/50 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 bg-popover text-popover-foreground text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-20 border border-border min-w-[140px]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isEarned ? achievement.color : 'text-muted-foreground'}`} />
                    <p className="font-bold">{achievement.name}</p>
                  </div>
                  <p className="text-muted-foreground">{achievement.description}</p>
                  {!isEarned && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Jarayon</span>
                        <span className="font-semibold text-primary">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  )}
                  {isEarned && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-success">
                      <Sparkles className="h-3 w-3" />
                      <span className="font-semibold">Qo'lga kiritildi!</span>
                    </div>
                  )}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};