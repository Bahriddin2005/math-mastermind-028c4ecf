import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { 
  ArrowLeft,
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target,
  Zap,
  Calendar
} from 'lucide-react';

interface GameSession {
  id: string;
  section: string;
  difficulty: string;
  mode: string;
  correct: number;
  incorrect: number;
  best_streak: number;
  score: number;
  total_time: number;
  created_at: string;
}

interface PeriodStats {
  score: number;
  solved: number;
  accuracy: number;
  bestStreak: number;
  avgTime: number;
  games: number;
}

const Statistics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [weekStats, setWeekStats] = useState<PeriodStats>({ score: 0, solved: 0, accuracy: 0, bestStreak: 0, avgTime: 0, games: 0 });
  const [monthStats, setMonthStats] = useState<PeriodStats>({ score: 0, solved: 0, accuracy: 0, bestStreak: 0, avgTime: 0, games: 0 });
  const [chartData, setChartData] = useState<{ date: string; score: number; accuracy: number }[]>([]);
  const [sectionData, setSectionData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionsData) {
        setSessions(sessionsData);

        const now = new Date();
        
        // Week start (Monday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Month start
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const calcStats = (filteredSessions: typeof sessionsData): PeriodStats => {
          const problems = filteredSessions.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
          const correct = filteredSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
          const score = filteredSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const accuracy = problems > 0 ? Math.round((correct / problems) * 100) : 0;
          const bestStreak = filteredSessions.reduce((max, s) => Math.max(max, s.best_streak || 0), 0);
          const totalTime = filteredSessions.reduce((sum, s) => sum + (s.total_time || 0), 0);
          const avgTime = problems > 0 ? Math.round((totalTime / problems) * 10) / 10 : 0;
          
          return { score, solved: problems, accuracy, bestStreak, avgTime, games: filteredSessions.length };
        };
        
        const weekSessions = sessionsData.filter(s => new Date(s.created_at) >= startOfWeek);
        setWeekStats(calcStats(weekSessions));
        
        const monthSessions = sessionsData.filter(s => new Date(s.created_at) >= startOfMonth);
        setMonthStats(calcStats(monthSessions));
        
        // Chart data - last 14 days
        const dailyData: { [key: string]: { score: number; correct: number; total: number } } = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          dailyData[dateStr] = { score: 0, correct: 0, total: 0 };
        }
        
        sessionsData.forEach(s => {
          const dateStr = s.created_at.split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].score += s.score || 0;
            dailyData[dateStr].correct += s.correct || 0;
            dailyData[dateStr].total += (s.correct || 0) + (s.incorrect || 0);
          }
        });
        
        const chartDataArray = Object.entries(dailyData).map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
          score: data.score,
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
        }));
        
        setChartData(chartDataArray);

        // Section breakdown
        const sectionScores: { [key: string]: number } = {};
        const sectionColors: { [key: string]: string } = {
          'mental-arithmetic': 'hsl(var(--primary))',
          'addition': 'hsl(var(--success))',
          'subtraction': 'hsl(var(--destructive))',
          'multiplication': 'hsl(var(--warning))',
          'division': 'hsl(var(--accent))',
        };
        
        monthSessions.forEach(s => {
          sectionScores[s.section] = (sectionScores[s.section] || 0) + (s.score || 0);
        });
        
        const sectionDataArray = Object.entries(sectionScores)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({
            name: name === 'mental-arithmetic' ? 'Mental' : name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: sectionColors[name] || 'hsl(var(--muted))',
          }));
        
        setSectionData(sectionDataArray);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistika
          </h1>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="p-4">
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-secondary/50">
            <TabsTrigger value="week" className="rounded-xl font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Hafta
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-xl font-semibold">
              <Calendar className="w-4 h-4 mr-2" />
              Oy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-4 space-y-4">
            <StatsGrid stats={weekStats} />
          </TabsContent>

          <TabsContent value="month" className="mt-4 space-y-4">
            <StatsGrid stats={monthStats} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Progress Chart */}
      <div className="px-4 mb-4">
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Haftalik progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} name="Ball" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend */}
      <div className="px-4 mb-4">
        <Card className="rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-success" />
              Aniqlik trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="accuracy" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Aniqlik %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Breakdown */}
      {sectionData.length > 0 && (
        <div className="px-4 mb-4">
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Bo'limlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {sectionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatsGrid = ({ stats }: { stats: PeriodStats }) => (
  <div className="grid grid-cols-2 gap-3">
    <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">{stats.score}</p>
          <p className="text-xs text-muted-foreground">Ball</p>
        </div>
      </div>
    </Card>

    <Card className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-accent">{stats.solved}</p>
          <p className="text-xs text-muted-foreground">Masala</p>
        </div>
      </div>
    </Card>

    <Card className="p-4 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border-success/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold text-success">{stats.accuracy}%</p>
          <p className="text-xs text-muted-foreground">Aniqlik</p>
        </div>
      </div>
    </Card>

    <Card className="p-4 rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-2xl font-bold text-warning">{stats.avgTime}s</p>
          <p className="text-xs text-muted-foreground">O'rtacha</p>
        </div>
      </div>
    </Card>
  </div>
);

export default Statistics;
