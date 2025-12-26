import { Card } from './ui/card';
import { Trophy, Target, Flame, Clock } from 'lucide-react';

interface StatsDisplayProps {
  correct: number;
  incorrect: number;
  streak: number;
  bestStreak: number;
  averageTime?: number;
}

export const StatsDisplay = ({ 
  correct, 
  incorrect, 
  streak, 
  bestStreak,
  averageTime 
}: StatsDisplayProps) => {
  const accuracy = correct + incorrect > 0 
    ? Math.round((correct / (correct + incorrect)) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card variant="stat" className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">To'g'ri</p>
          <p className="text-xl font-bold font-display text-primary">{correct}</p>
        </div>
      </Card>

      <Card variant="stat" className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <span className="text-lg">❌</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Xato</p>
          <p className="text-xl font-bold font-display text-destructive">{incorrect}</p>
        </div>
      </Card>

      <Card variant="stat" className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl gradient-accent flex items-center justify-center">
          <Flame className="h-5 w-5 text-accent-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Seriya</p>
          <p className="text-xl font-bold font-display text-accent">{streak}</p>
        </div>
      </Card>

      <Card variant="stat" className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-warning" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Eng yaxshi</p>
          <p className="text-xl font-bold font-display">{bestStreak}</p>
        </div>
      </Card>
    </div>
  );
};
