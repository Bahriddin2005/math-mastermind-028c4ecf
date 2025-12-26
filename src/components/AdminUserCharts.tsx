import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from 'recharts';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  created_at: string;
}

interface GameSession {
  id: string;
  user_id: string;
  difficulty: string;
  section: string;
  score: number;
  correct: number;
  incorrect: number;
  created_at: string;
}

interface AdminUserChartsProps {
  users: UserProfile[];
  gameSessions: GameSession[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(48 96% 53%)',
  'hsl(262 83% 58%)',
  'hsl(12 76% 61%)',
  'hsl(199 89% 48%)',
];

export const AdminUserCharts = ({ users, gameSessions }: AdminUserChartsProps) => {
  // Top 10 users by score
  const topUsersByScore = useMemo(() => {
    return users
      .slice(0, 10)
      .map(u => ({
        name: u.username.length > 10 ? u.username.slice(0, 10) + '...' : u.username,
        ball: u.total_score,
        masala: u.total_problems_solved,
      }));
  }, [users]);

  // Users by registration date (last 7 days)
  const usersByDate = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = users.filter(u => u.created_at.startsWith(date)).length;
      const dayName = new Date(date).toLocaleDateString('uz-UZ', { weekday: 'short' });
      return { date: dayName, foydalanuvchilar: count };
    });
  }, [users]);

  // Games by difficulty
  const gamesByDifficulty = useMemo(() => {
    const difficultyCount: Record<string, number> = {};
    gameSessions.forEach(session => {
      const diff = session.difficulty || 'unknown';
      difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
    });

    const difficultyNames: Record<string, string> = {
      easy: 'Oson',
      medium: "O'rta",
      hard: 'Qiyin',
      unknown: "Noma'lum"
    };

    return Object.entries(difficultyCount).map(([key, value]) => ({
      name: difficultyNames[key] || key,
      value,
    }));
  }, [gameSessions]);

  // Games by section
  const gamesBySection = useMemo(() => {
    const sectionCount: Record<string, number> = {};
    gameSessions.forEach(session => {
      const section = session.section || 'other';
      sectionCount[section] = (sectionCount[section] || 0) + 1;
    });

    const sectionNames: Record<string, string> = {
      addition: "Qo'shish",
      subtraction: 'Ayirish',
      multiplication: "Ko'paytirish",
      division: "Bo'lish",
      mixed: 'Aralash',
      other: 'Boshqa'
    };

    return Object.entries(sectionCount).map(([key, value]) => ({
      name: sectionNames[key] || key,
      value,
    }));
  }, [gameSessions]);

  // Games per day (last 7 days)
  const gamesPerDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayGames = gameSessions.filter(g => g.created_at.startsWith(date));
      const totalScore = dayGames.reduce((sum, g) => sum + (g.score || 0), 0);
      const dayName = new Date(date).toLocaleDateString('uz-UZ', { weekday: 'short' });
      return { 
        date: dayName, 
        oyinlar: dayGames.length,
        ball: totalScore 
      };
    });
  }, [gameSessions]);

  // Average accuracy by difficulty
  const accuracyByDifficulty = useMemo(() => {
    const difficultyStats: Record<string, { correct: number; total: number }> = {};
    
    gameSessions.forEach(session => {
      const diff = session.difficulty || 'unknown';
      if (!difficultyStats[diff]) {
        difficultyStats[diff] = { correct: 0, total: 0 };
      }
      difficultyStats[diff].correct += session.correct || 0;
      difficultyStats[diff].total += (session.correct || 0) + (session.incorrect || 0);
    });

    const difficultyNames: Record<string, string> = {
      easy: 'Oson',
      medium: "O'rta",
      hard: 'Qiyin',
    };

    return Object.entries(difficultyStats)
      .filter(([key]) => key !== 'unknown')
      .map(([key, stats]) => ({
        name: difficultyNames[key] || key,
        aniqlik: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }));
  }, [gameSessions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Users by Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 foydalanuvchi (ball bo'yicha)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topUsersByScore} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis type="category" dataKey="name" width={80} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="ball" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* New Users Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yangi foydalanuvchilar (so'nggi 7 kun)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={usersByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="foydalanuvchilar" 
                fill="hsl(var(--primary) / 0.3)" 
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Games by Difficulty Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">O'yinlar qiyinlik bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={gamesByDifficulty}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {gamesByDifficulty.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Games by Section Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">O'yinlar bo'lim bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={gamesBySection}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {gamesBySection.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Games per Day Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kunlik o'yinlar va ball (so'nggi 7 kun)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={gamesPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="oyinlar" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ball" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142 76% 36%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy by Difficulty */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">O'rtacha aniqlik (qiyinlik bo'yicha)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={accuracyByDifficulty}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value}%`, 'Aniqlik']}
              />
              <Bar dataKey="aniqlik" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
