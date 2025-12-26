import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  LucideIcon
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  requirement: number;
  type: 'problems' | 'streak' | 'score' | 'games';
}

const achievements: Achievement[] = [
  // Problems solved
  { id: 'first10', name: 'Birinchi qadam', description: '10 ta misol yech', icon: Target, color: 'text-primary', bgColor: 'bg-primary/10', requirement: 10, type: 'problems' },
  { id: 'solver50', name: 'Faol o\'quvchi', description: '50 ta misol yech', icon: Zap, color: 'text-accent', bgColor: 'bg-accent/10', requirement: 50, type: 'problems' },
  { id: 'solver100', name: 'Yuz misol', description: '100 ta misol yech', icon: Star, color: 'text-warning', bgColor: 'bg-warning/10', requirement: 100, type: 'problems' },
  { id: 'solver500', name: 'Matematik', description: '500 ta misol yech', icon: Brain, color: 'text-success', bgColor: 'bg-success/10', requirement: 500, type: 'problems' },
  { id: 'solver1000', name: 'Usta', description: '1000 ta misol yech', icon: Crown, color: 'text-primary', bgColor: 'gradient-primary', requirement: 1000, type: 'problems' },
  
  // Streak
  { id: 'streak5', name: 'Boshlang\'ich seriya', description: '5 ta misol ketma-ket to\'g\'ri', icon: Flame, color: 'text-accent', bgColor: 'bg-accent/10', requirement: 5, type: 'streak' },
  { id: 'streak10', name: 'O\'t seriyasi', description: '10 ta ketma-ket to\'g\'ri', icon: Flame, color: 'text-warning', bgColor: 'bg-warning/10', requirement: 10, type: 'streak' },
  { id: 'streak25', name: 'Ajoyib seriya', description: '25 ta ketma-ket to\'g\'ri', icon: Rocket, color: 'text-success', bgColor: 'bg-success/10', requirement: 25, type: 'streak' },
  { id: 'streak50', name: 'Legenda', description: '50 ta ketma-ket to\'g\'ri', icon: Crown, color: 'text-primary', bgColor: 'gradient-primary', requirement: 50, type: 'streak' },
  
  // Score
  { id: 'score100', name: 'Yuz ball', description: '100 ball to\'pla', icon: Medal, color: 'text-primary', bgColor: 'bg-primary/10', requirement: 100, type: 'score' },
  { id: 'score500', name: 'Yuqori ball', description: '500 ball to\'pla', icon: Award, color: 'text-accent', bgColor: 'bg-accent/10', requirement: 500, type: 'score' },
  { id: 'score1000', name: 'Ming ball', description: '1000 ball to\'pla', icon: Trophy, color: 'text-warning', bgColor: 'bg-warning/20', requirement: 1000, type: 'score' },
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
    <Card className="border-border/40 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3 bg-gradient-to-r from-warning/5 to-accent/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Yutuqlar
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {earnedCount} / {achievements.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {achievements.map((achievement, index) => {
            const isEarned = checkAchievement(achievement);
            const progress = getProgress(achievement);
            const Icon = achievement.icon;
            
            return (
              <div
                key={achievement.id}
                className={`relative group cursor-pointer opacity-0 animate-slide-up`}
                style={{ animationDelay: `${400 + index * 30}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 ${
                    isEarned
                      ? `${achievement.bgColor} shadow-md hover:scale-110`
                      : 'bg-secondary/50 opacity-50 grayscale hover:opacity-70'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isEarned ? achievement.color : 'text-muted-foreground'}`} />
                  {!isEarned && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary/50 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-border">
                  <p className="font-semibold">{achievement.name}</p>
                  <p className="text-muted-foreground">{achievement.description}</p>
                  {!isEarned && (
                    <p className="text-primary mt-1">
                      {Math.round(progress)}% tugallangan
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
