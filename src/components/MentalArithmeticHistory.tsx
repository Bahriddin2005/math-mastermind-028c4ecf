import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { uz } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Target, Flame } from 'lucide-react';

interface GameSession {
  id: string;
  created_at: string;
  correct: number;
  incorrect: number;
  best_streak: number;
  score: number;
  difficulty: string;
  total_time: number;
}

interface MentalArithmeticHistoryProps {
  refreshTrigger?: number;
}

export const MentalArithmeticHistory = ({ refreshTrigger }: MentalArithmeticHistoryProps) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('section', 'mental-arithmetic')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setSessions(data);
      }
      setLoading(false);
    };

    fetchSessions();
  }, [user, refreshTrigger]);

  // Kunlik statistika (oxirgi 7 kun)
  const dailyStats = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      
      const daySessions = sessions.filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });

      const correct = daySessions.reduce((sum, s) => sum + (s.correct || 0), 0);
      const incorrect = daySessions.reduce((sum, s) => sum + (s.incorrect || 0), 0);
      const total = correct + incorrect;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      return {
        date: format(day, 'EEE', { locale: uz }),
        fullDate: format(day, 'dd MMM', { locale: uz }),
        correct,
        incorrect,
        total,
        accuracy,
        sessions: daySessions.length,
      };
    });
  }, [sessions]);

  // Haftalik statistika (oxirgi 4 hafta)
  const weeklyStats = useMemo(() => {
    const weeks = [];
    const today = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
      
      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.created_at);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const correct = weekSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
      const incorrect = weekSessions.reduce((sum, s) => sum + (s.incorrect || 0), 0);
      const total = correct + incorrect;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const avgStreak = weekSessions.length > 0
        ? Math.round(weekSessions.reduce((sum, s) => sum + (s.best_streak || 0), 0) / weekSessions.length)
        : 0;

      weeks.push({
        week: `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
        label: i === 0 ? 'Bu hafta' : i === 1 ? "O'tgan hafta" : `${i + 1} hafta oldin`,
        correct,
        incorrect,
        total,
        accuracy,
        avgStreak,
        sessions: weekSessions.length,
      });
    }

    return weeks;
  }, [sessions]);

  // Qiyinlik bo'yicha statistika
  const difficultyStats = useMemo(() => {
    const difficulties = ['easy', 'medium', 'hard'];
    const labels = { easy: 'Oson', medium: "O'rta", hard: 'Qiyin' };
    const colors = ['#22c55e', '#f59e0b', '#ef4444'];

    return difficulties.map((diff, index) => {
      const diffSessions = sessions.filter(s => s.difficulty === diff);
      const correct = diffSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
      const incorrect = diffSessions.reduce((sum, s) => sum + (s.incorrect || 0), 0);
      const total = correct + incorrect;

      return {
        name: labels[diff as keyof typeof labels],
        value: total,
        correct,
        incorrect,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        color: colors[index],
      };
    }).filter(d => d.value > 0);
  }, [sessions]);

  // Umumiy statistika
  const overallStats = useMemo(() => {
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.correct || 0), 0);
    const totalIncorrect = sessions.reduce((sum, s) => sum + (s.incorrect || 0), 0);
    const totalProblems = totalCorrect + totalIncorrect;
    const bestStreak = sessions.length > 0 ? Math.max(...sessions.map(s => s.best_streak || 0)) : 0;
    const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgAccuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

    // Bugungi statistika
    const today = new Date();
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.created_at);
      return sessionDate >= startOfDay(today) && sessionDate <= endOfDay(today);
    });
    const todayCorrect = todaySessions.reduce((sum, s) => sum + (s.correct || 0), 0);
    const todayTotal = todaySessions.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);

    return {
      totalProblems,
      totalCorrect,
      totalIncorrect,
      bestStreak,
      totalScore,
      avgAccuracy,
      todayProblems: todayTotal,
      todayCorrect,
      totalSessions: sessions.length,
    };
  }, [sessions]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Statistikani ko'rish uchun tizimga kiring</p>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Hali mashq qilmadingiz. Birinchi mashqingizni boshlang!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Umumiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Target className="h-4 w-4" />
            Bugun
          </div>
          <div className="text-2xl font-bold text-primary mt-1">
            {overallStats.todayCorrect}/{overallStats.todayProblems}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <TrendingUp className="h-4 w-4" />
            Aniqlik
          </div>
          <div className="text-2xl font-bold text-blue-500 mt-1">
            {overallStats.avgAccuracy}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Flame className="h-4 w-4" />
            Eng uzun seriya
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-1">
            {overallStats.bestStreak}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            Jami mashqlar
          </div>
          <div className="text-2xl font-bold text-green-500 mt-1">
            {overallStats.totalSessions}
          </div>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Kunlik</TabsTrigger>
          <TabsTrigger value="weekly">Haftalik</TabsTrigger>
          <TabsTrigger value="difficulty">Qiyinlik</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oxirgi 7 kun</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.fullDate}</p>
                              <p className="text-green-500">To'g'ri: {data.correct}</p>
                              <p className="text-red-500">Noto'g'ri: {data.incorrect}</p>
                              <p className="text-muted-foreground">Aniqlik: {data.accuracy}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="correct" name="To'g'ri" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="incorrect" name="Noto'g'ri" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Haftalik progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.week}</p>
                              <p className="text-primary">Jami: {data.total}</p>
                              <p className="text-green-500">To'g'ri: {data.correct}</p>
                              <p className="text-blue-500">Aniqlik: {data.accuracy}%</p>
                              <p className="text-amber-500">O'rtacha seriya: {data.avgStreak}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="Jami masalalar" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      name="Aniqlik %" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="difficulty" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Qiyinlik darajasi bo'yicha</CardTitle>
            </CardHeader>
            <CardContent>
              {difficultyStats.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-[250px] w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={difficultyStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {difficultyStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p>Jami: {data.value}</p>
                                  <p className="text-green-500">To'g'ri: {data.correct}</p>
                                  <p>Aniqlik: {data.accuracy}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {difficultyStats.map((stat) => (
                      <div key={stat.name} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: stat.color }} 
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium">{stat.name}</span>
                            <span className="text-muted-foreground">{stat.value} masala</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Aniqlik: {stat.accuracy}%</span>
                            <span>To'g'ri: {stat.correct}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Ma'lumot yo'q</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MentalArithmeticHistory;
