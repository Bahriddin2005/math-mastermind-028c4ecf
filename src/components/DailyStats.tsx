import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, Trophy, Target, Flame, TrendingUp } from 'lucide-react';

interface DailyStatsProps {
  todayScore: number;
  todaySolved: number;
  todayAccuracy: number;
  currentStreak: number;
}

export const DailyStats = ({
  todayScore,
  todaySolved,
  todayAccuracy,
  currentStreak,
}: DailyStatsProps) => {
  return (
    <Card className="border-border/40 shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Kunlik statistika
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Bugungi ball - asosiy ko'rsatkich */}
          <div className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bugungi ball</p>
                  <p className="text-3xl font-display font-bold text-primary">{todayScore}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">ball</span>
              </div>
            </div>
          </div>

          {/* Yechilgan misollar */}
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Yechilgan</span>
            </div>
            <p className="text-xl font-display font-bold text-accent">{todaySolved}</p>
            <span className="text-xs text-muted-foreground">ta misol</span>
          </div>

          {/* Aniqlik */}
          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Aniqlik</span>
            </div>
            <p className="text-xl font-display font-bold text-success">{todayAccuracy}%</p>
            <span className="text-xs text-muted-foreground">bugun</span>
          </div>

          {/* Kunlik seriya */}
          <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">Kunlik seriya</span>
            </div>
            <span className="text-xl font-display font-bold text-warning">
              {currentStreak} kun
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
