import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, Trophy, Target, Flame, TrendingUp, Zap, Clock, Calendar } from 'lucide-react';

interface PeriodStats {
  score: number;
  solved: number;
  accuracy: number;
  bestStreak: number;
  avgTime: number;
}

interface DailyStatsProps {
  todayStats: PeriodStats;
  weekStats: PeriodStats;
  monthStats: PeriodStats;
  currentStreak: number;
}

type Period = 'today' | 'week' | 'month';

export const DailyStats = ({
  todayStats,
  weekStats,
  monthStats,
  currentStreak,
}: DailyStatsProps) => {
  const [activePeriod, setActivePeriod] = useState<Period>('today');

  const formatTime = (seconds: number) => {
    if (seconds === 0) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getStats = () => {
    switch (activePeriod) {
      case 'week': return weekStats;
      case 'month': return monthStats;
      default: return todayStats;
    }
  };

  const getPeriodLabel = () => {
    switch (activePeriod) {
      case 'week': return 'Haftalik';
      case 'month': return 'Oylik';
      default: return 'Bugungi';
    }
  };

  const stats = getStats();

  const periods: { key: Period; label: string; shortLabel: string }[] = [
    { key: 'today', label: 'Bugun', shortLabel: 'Bugun' },
    { key: 'week', label: 'Hafta', shortLabel: 'Hafta' },
    { key: 'month', label: 'Oy', shortLabel: 'Oy' },
  ];

  return (
    <Card className="border-border/40 shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Statistika</span>
            <span className="sm:hidden">Stat</span>
          </CardTitle>
          
          {/* Period Tabs */}
          <div className="flex items-center bg-secondary/60 rounded-lg p-0.5">
            {periods.map((period) => (
              <button
                key={period.key}
                onClick={() => setActivePeriod(period.key)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                  activePeriod === period.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period.shortLabel}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Ball - asosiy ko'rsatkich */}
          <div className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{getPeriodLabel()} ball</p>
                  <p className="text-3xl font-display font-bold text-primary">{stats.score}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{getPeriodLabel()}</span>
              </div>
            </div>
          </div>

          {/* Yechilgan misollar */}
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Yechilgan</span>
            </div>
            <p className="text-xl font-display font-bold text-accent">{stats.solved}</p>
            <span className="text-xs text-muted-foreground">ta misol</span>
          </div>

          {/* Aniqlik */}
          <div className="p-3 rounded-xl bg-success/10 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Aniqlik</span>
            </div>
            <p className="text-xl font-display font-bold text-success">{stats.accuracy}%</p>
            <span className="text-xs text-muted-foreground">{getPeriodLabel().toLowerCase()}</span>
          </div>

          {/* Eng yaxshi seriya */}
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Eng yaxshi</span>
            </div>
            <p className="text-xl font-display font-bold text-orange-500">{stats.bestStreak}</p>
            <span className="text-xs text-muted-foreground">ta ketma-ket</span>
          </div>

          {/* O'rtacha vaqt */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-sky-500" />
              <span className="text-xs text-muted-foreground">O'rtacha</span>
            </div>
            <p className="text-xl font-display font-bold text-sky-500">{formatTime(stats.avgTime)}</p>
            <span className="text-xs text-muted-foreground">har bir misol</span>
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
