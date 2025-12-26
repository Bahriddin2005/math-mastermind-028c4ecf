import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { getSectionInfo, MathSection } from '@/lib/mathGenerator';

interface GameSession {
  section: string;
  correct: number;
  incorrect: number;
  score: number;
  created_at: string;
}

interface StatsChartsProps {
  sessions: GameSession[];
}

const COLORS = {
  primary: 'hsl(145, 80%, 42%)',
  accent: 'hsl(28, 95%, 55%)',
  warning: 'hsl(45, 95%, 55%)',
  success: 'hsl(145, 80%, 42%)',
  muted: 'hsl(160, 20%, 45%)',
};

export const StatsCharts = ({ sessions }: StatsChartsProps) => {
  // Weekly data - last 7 days
  const getWeeklyData = () => {
    const days = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const today = new Date();
    const weekData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = sessions.filter(s => 
        s.created_at.startsWith(dateStr)
      );
      
      const solved = daySessions.reduce((sum, s) => sum + s.correct + s.incorrect, 0);
      const correct = daySessions.reduce((sum, s) => sum + s.correct, 0);
      
      weekData.push({
        name: days[date.getDay()],
        solved,
        correct,
        date: date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
      });
    }

    return weekData;
  };

  // Section breakdown
  const getSectionData = () => {
    const sectionCounts: Record<string, { correct: number; incorrect: number }> = {};
    
    sessions.forEach(session => {
      if (!sectionCounts[session.section]) {
        sectionCounts[session.section] = { correct: 0, incorrect: 0 };
      }
      sectionCounts[session.section].correct += session.correct;
      sectionCounts[session.section].incorrect += session.incorrect;
    });

    return Object.entries(sectionCounts).map(([section, data]) => ({
      name: getSectionInfo(section as MathSection).name,
      value: data.correct + data.incorrect,
      correct: data.correct,
      icon: getSectionInfo(section as MathSection).icon,
    }));
  };

  // Accuracy trend
  const getAccuracyTrend = () => {
    const grouped: Record<string, { correct: number; total: number }> = {};
    
    sessions.forEach(session => {
      const date = session.created_at.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { correct: 0, total: 0 };
      }
      grouped[date].correct += session.correct;
      grouped[date].total += session.correct + session.incorrect;
    });

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, data]) => ({
        name: new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      }));
  };

  const weeklyData = getWeeklyData();
  const sectionData = getSectionData();
  const accuracyData = getAccuracyTrend();

  const pieColors = [COLORS.primary, COLORS.accent, COLORS.warning, COLORS.success];

  if (sessions.length === 0) {
    return (
      <Card className="border-border/40 shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Statistika uchun kamida bitta o'yin o'ynang
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      {/* Weekly Progress Chart */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Haftalik progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'solved' ? 'Jami' : 'To\'g\'ri'
                  ]}
                  labelFormatter={(label) => {
                    const day = weeklyData.find(d => d.name === label);
                    return day?.date || label;
                  }}
                />
                <Bar dataKey="solved" fill={COLORS.muted} radius={[4, 4, 0, 0]} name="solved" />
                <Bar dataKey="correct" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="correct" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section Breakdown */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent" />
              Bo'limlar bo'yicha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={sectionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sectionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value} ta misol`, 'Jami']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {sectionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Trend */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Aniqlik trendi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Aniqlik']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={{ fill: COLORS.success, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
