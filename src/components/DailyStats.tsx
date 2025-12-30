import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, Trophy, Target, Flame, TrendingUp, Zap, Clock, Calendar } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface PeriodStats {
  score: number;
  solved: number;
  accuracy: number;
  bestStreak: number;
  avgTime: number;
}

interface ChartDataPoint {
  date: string;
  score: number;
  solved: number;
}

interface DailyStatsProps {
  todayStats: PeriodStats;
  weekStats: PeriodStats;
  monthStats: PeriodStats;
  currentStreak: number;
  chartData: ChartDataPoint[];
}

type Period = 'today' | 'week' | 'month';

export const DailyStats = ({
  todayStats,
  weekStats,
  monthStats,
  currentStreak,
  chartData,
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

  // Filter chart data based on period
  const filteredChartData = useMemo(() => {
    const now = new Date();
    switch (activePeriod) {
      case 'today':
        return chartData.slice(-7); // Oxirgi 7 kun
      case 'week':
        return chartData.slice(-7); // Oxirgi 7 kun
      case 'month':
        return chartData.slice(-30); // Oxirgi 30 kun
      default:
        return chartData.slice(-7);
    }
  }, [chartData, activePeriod]);

  const stats = getStats();

  const periods: { key: Period; label: string; shortLabel: string }[] = [
    { key: 'today', label: 'Bugun', shortLabel: 'Bugun' },
    { key: 'week', label: 'Hafta', shortLabel: 'Hafta' },
    { key: 'month', label: 'Oy', shortLabel: 'Oy' },
  ];

  // Trend ko'rsatkich (oxirgi 2 kun taqqoslash)
  const getTrend = () => {
    if (filteredChartData.length < 2) return { direction: 'neutral', percent: 0 };
    const lastTwo = filteredChartData.slice(-2);
    const prev = lastTwo[0]?.score || 0;
    const current = lastTwo[1]?.score || 0;
    if (prev === 0) return { direction: current > 0 ? 'up' : 'neutral', percent: 0 };
    const percent = Math.round(((current - prev) / prev) * 100);
    return { 
      direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
      percent: Math.abs(percent)
    };
  };

  const trend = getTrend();

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
          {/* Ball + Sparkline */}
          <div className="col-span-2 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{getPeriodLabel()} ball</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-display font-bold text-primary">{stats.score}</p>
                    {trend.direction !== 'neutral' && trend.percent > 0 && (
                      <span className={`text-xs font-medium ${trend.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
                        {trend.direction === 'up' ? '↑' : '↓'} {trend.percent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mini Sparkline Chart */}
              {filteredChartData.length > 1 && (
                <div className="w-24 h-12 sm:w-32 sm:h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          padding: '6px 10px'
                        }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        formatter={(value: number) => [`${value} ball`, '']}
                        labelFormatter={(label) => label}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#sparklineGradient)"
                        dot={false}
                        activeDot={{ r: 3, fill: 'hsl(var(--primary))' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
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
