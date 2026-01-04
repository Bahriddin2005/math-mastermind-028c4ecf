import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ActivityRing } from './ActivityRing';
import { Target, Zap, TrendingUp, Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressVisualizationProps {
  dailyGoal: number;
  problemsSolved: number;
  accuracy: number;
  streak: number;
  level: number;
}

export const ProgressVisualization = ({
  dailyGoal,
  problemsSolved,
  accuracy,
  streak,
  level,
}: ProgressVisualizationProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const goalProgress = useMemo(() => {
    return Math.min(100, Math.round((problemsSolved / dailyGoal) * 100));
  }, [problemsSolved, dailyGoal]);

  const levelProgress = useMemo(() => {
    // Simple level progression (every 1000 points = next level)
    const pointsInCurrentLevel = (level * 1000);
    const pointsForNextLevel = ((level + 1) * 1000);
    const pointsNeeded = pointsForNextLevel - pointsInCurrentLevel;
    return Math.min(100, Math.round(((problemsSolved % 1000) / pointsNeeded) * 100));
  }, [problemsSolved, level]);

  const isGoalCompleted = problemsSolved >= dailyGoal;

  // Animate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(goalProgress);
    }, 300);
    return () => clearTimeout(timer);
  }, [goalProgress]);

  return (
    <Card className="border-border/40 dark:border-border/20 shadow-md dark:shadow-lg dark:shadow-black/20 overflow-hidden opacity-0 animate-slide-up bg-card dark:bg-card/95" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-2 bg-gradient-to-r from-accent/5 via-primary/5 to-transparent dark:from-accent/10 dark:via-primary/10 dark:to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent/80 dark:from-accent dark:to-accent/70 flex items-center justify-center shadow-sm dark:shadow-accent/30">
            <Award className="h-4 w-4 text-accent-foreground" />
          </div>
          <span>Rivojlanish</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Enhanced Daily Goal Section */}
        <div className={cn(
          "relative p-4 rounded-2xl mb-6 transition-all duration-500",
          isGoalCompleted 
            ? "bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/10 border-2 border-green-500/30" 
            : "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20"
        )}>
          {/* Celebration particles for completed goal */}
          {isGoalCompleted && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute top-2 left-4 animate-pulse"><Sparkles className="h-3 w-3 text-green-400" /></div>
              <div className="absolute top-4 right-6 animate-pulse" style={{ animationDelay: '0.3s' }}><Sparkles className="h-2 w-2 text-emerald-400" /></div>
              <div className="absolute bottom-3 left-8 animate-pulse" style={{ animationDelay: '0.6s' }}><Sparkles className="h-2 w-2 text-teal-400" /></div>
              <div className="absolute bottom-4 right-4 animate-pulse" style={{ animationDelay: '0.9s' }}><Sparkles className="h-3 w-3 text-green-300" /></div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg transition-all duration-300",
                isGoalCompleted ? "bg-green-500/20" : "bg-primary/20"
              )}>
                {isGoalCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 animate-scale-in" />
                ) : (
                  <Target className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm">Kunlik maqsad</h3>
                <p className="text-xs text-muted-foreground">
                  {isGoalCompleted ? "Bajarildi! 🎉" : `${dailyGoal - problemsSolved} ta qoldi`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-2xl font-bold transition-colors",
                isGoalCompleted ? "text-green-500" : "text-primary"
              )}>
                {problemsSolved}
                <span className="text-sm text-muted-foreground font-normal">/{dailyGoal}</span>
              </p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="relative">
            <div className="h-4 bg-secondary/60 dark:bg-secondary/40 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out relative",
                  isGoalCompleted 
                    ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" 
                    : "bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                )}
                style={{ width: `${animatedProgress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" 
                  style={{ animationDuration: '2s' }} 
                />
              </div>
            </div>
            
            {/* Progress percentage badge */}
            <div 
              className={cn(
                "absolute -top-1 transition-all duration-1000 ease-out",
                isGoalCompleted ? "text-green-500" : "text-primary"
              )}
              style={{ left: `${Math.min(animatedProgress, 92)}%` }}
            >
              <span className="text-xs font-bold bg-card px-1.5 py-0.5 rounded-full shadow-sm border border-border/50">
                {animatedProgress}%
              </span>
            </div>
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between mt-2 px-1">
            {[25, 50, 75, 100].map((milestone) => (
              <div 
                key={milestone}
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  goalProgress >= milestone ? "text-primary" : "text-muted-foreground/50"
                )}
              >
                {milestone}%
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {/* Daily Goal Progress */}
          <div className={cn(
            "flex flex-col items-center p-2 rounded-xl border transition-all duration-300",
            isGoalCompleted 
              ? "bg-green-500/10 border-green-500/30 dark:bg-green-500/15" 
              : "bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20"
          )}>
            <ActivityRing
              progress={goalProgress}
              size={100}
              strokeWidth={8}
              color={isGoalCompleted ? "success" : "primary"}
              value={problemsSolved}
              label={`/${dailyGoal} maqsad`}
              icon={isGoalCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            />
          </div>

          {/* Accuracy Ring */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-success/5 dark:bg-success/10 border border-success/10 dark:border-success/20 transition-colors">
            <ActivityRing
              progress={accuracy}
              size={100}
              strokeWidth={8}
              color="success"
              value={`${accuracy}%`}
              label="aniqlik"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Streak Progress */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-warning/5 dark:bg-warning/10 border border-warning/10 dark:border-warning/20 transition-colors">
            <ActivityRing
              progress={Math.min(100, streak * 10)}
              size={100}
              strokeWidth={8}
              color="warning"
              value={streak}
              label="kunlik seriya"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          {/* Level Progress */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-accent/5 dark:bg-accent/10 border border-accent/10 dark:border-accent/20 transition-colors">
            <ActivityRing
              progress={levelProgress}
              size={100}
              strokeWidth={8}
              color="accent"
              value={`Lv.${level}`}
              label="daraja"
              icon={<Award className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Progress bars below - Enhanced dark mode */}
        <div className="mt-6 space-y-3">
          <ProgressBar 
            label="Kunlik maqsad" 
            value={goalProgress} 
            color="primary" 
            suffix={`${problemsSolved}/${dailyGoal}`}
          />
          <ProgressBar 
            label="Aniqlik" 
            value={accuracy} 
            color="success" 
            suffix={`${accuracy}%`}
          />
          <ProgressBar 
            label="Keyingi darajaga" 
            value={levelProgress} 
            color="accent" 
            suffix={`${levelProgress}%`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

const ProgressBar = ({ 
  label, 
  value, 
  color, 
  suffix 
}: { 
  label: string; 
  value: number; 
  color: 'primary' | 'accent' | 'success' | 'warning';
  suffix?: string;
}) => {
  const colorClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground dark:text-muted-foreground/80 font-medium">{label}</span>
        <span className="font-semibold text-foreground">{suffix}</span>
      </div>
      <div className="h-2 bg-secondary dark:bg-secondary/60 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClasses[color]} shadow-sm`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
};