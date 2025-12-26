import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GameStats } from '@/lib/mathGenerator';
import { Trophy, Target, Clock, Flame, RotateCcw, Home, LogIn } from 'lucide-react';

interface GameResultsProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onGoHome: () => void;
  isLoggedIn?: boolean;
}

export const GameResults = ({ stats, onPlayAgain, onGoHome, isLoggedIn }: GameResultsProps) => {
  const accuracy = stats.correct + stats.incorrect > 0
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
    : 0;
  
  const avgTime = stats.problems > 0
    ? (stats.totalTime / stats.problems).toFixed(1)
    : '0';

  const score = stats.correct * 10 + stats.bestStreak * 5;

  // Determine result message based on accuracy
  let resultMessage = '';
  let resultEmoji = '';
  if (accuracy >= 90) {
    resultMessage = "Zo'r natija!";
    resultEmoji = '🏆';
  } else if (accuracy >= 70) {
    resultMessage = "Yaxshi ish!";
    resultEmoji = '⭐';
  } else if (accuracy >= 50) {
    resultMessage = "Yaxshi harakat!";
    resultEmoji = '💪';
  } else {
    resultMessage = "Mashq qiling!";
    resultEmoji = '📚';
  }

  return (
    <Card variant="game" className="p-8 max-w-lg mx-auto animate-scale-in">
      <CardHeader className="text-center pb-2">
        <div className="text-6xl mb-4">{resultEmoji}</div>
        <CardTitle className="text-3xl">{resultMessage}</CardTitle>
        {isLoggedIn && (
          <p className="text-2xl font-display font-bold text-primary mt-2">
            +{score} ball
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-2xl bg-primary/10">
            <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">To'g'ri</p>
            <p className="text-3xl font-display font-bold text-primary">{stats.correct}</p>
          </div>

          <div className="text-center p-4 rounded-2xl bg-destructive/10">
            <span className="text-2xl block mb-2">❌</span>
            <p className="text-sm text-muted-foreground">Xato</p>
            <p className="text-3xl font-display font-bold text-destructive">{stats.incorrect}</p>
          </div>

          <div className="text-center p-4 rounded-2xl bg-accent/10">
            <Flame className="h-8 w-8 mx-auto mb-2 text-accent" />
            <p className="text-sm text-muted-foreground">Eng uzun seriya</p>
            <p className="text-3xl font-display font-bold text-accent">{stats.bestStreak}</p>
          </div>

          <div className="text-center p-4 rounded-2xl bg-secondary">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">O'rtacha vaqt</p>
            <p className="text-3xl font-display font-bold">{avgTime}s</p>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Aniqlik</span>
            <span className="font-bold">{accuracy}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500"
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Login prompt if not logged in */}
        {!isLoggedIn && (
          <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-3">
              Natijalaringizni saqlash va reytingda qatnashish uchun tizimga kiring
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                Kirish
              </Button>
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" size="lg" onClick={onGoHome} className="flex-1">
            <Home className="h-5 w-5 mr-2" />
            Bosh sahifa
          </Button>
          <Button variant="game" size="lg" onClick={onPlayAgain} className="flex-1">
            <RotateCcw className="h-5 w-5 mr-2" />
            Qayta o'ynash
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
