import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  FileDown, 
  Loader2, 
  Users, 
  Target, 
  Trophy, 
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

interface DailyStats {
  date: string;
  users: number;
  problems: number;
  games: number;
}

interface SectionStats {
  name: string;
  count: number;
  percentage: number;
}

interface UserActivity {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  last_active: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [sectionStats, setSectionStats] = useState<SectionStats[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [totals, setTotals] = useState({
    users: 0,
    problems: 0,
    games: 0,
    avgScore: 0
  });
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    const days = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('total_score', { ascending: false });

    // Fetch game sessions
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (profiles && sessions) {
      // Calculate daily stats
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const daily: DailyStats[] = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayUsers = profiles.filter(p => p.created_at.startsWith(dateStr)).length;
        const daySessions = sessions.filter(s => s.created_at.startsWith(dateStr));
        const dayProblems = daySessions.reduce((sum, s) => sum + (s.problems_solved || 0), 0);
        
        return {
          date: format(date, 'dd MMM'),
          users: dayUsers,
          problems: dayProblems,
          games: daySessions.length
        };
      });
      setDailyStats(daily);

      // Calculate section stats
      const sectionCounts: Record<string, number> = {};
      sessions.forEach(s => {
        sectionCounts[s.section] = (sectionCounts[s.section] || 0) + 1;
      });
      const totalSessions = sessions.length || 1;
      const sections: SectionStats[] = Object.entries(sectionCounts).map(([name, count]) => ({
        name: getSectionName(name),
        count,
        percentage: Math.round((count / totalSessions) * 100)
      })).sort((a, b) => b.count - a.count);
      setSectionStats(sections);

      // Top users
      const top = profiles.slice(0, 10).map(p => ({
        username: p.username,
        total_score: p.total_score || 0,
        total_problems_solved: p.total_problems_solved || 0,
        best_streak: p.best_streak || 0,
        last_active: p.last_active_date || p.created_at
      }));
      setTopUsers(top);

      // Totals
      const newUsers = profiles.filter(p => 
        new Date(p.created_at) >= startDate
      ).length;
      const totalProblems = sessions.reduce((sum, s) => sum + (s.problems_solved || 0), 0);
      const avgScore = sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
        : 0;

      setTotals({
        users: newUsers,
        problems: totalProblems,
        games: sessions.length,
        avgScore
      });
    }

    setLoading(false);
  };

  const getSectionName = (section: string) => {
    const names: Record<string, string> = {
      'add': "Qo'shish",
      'subtract': 'Ayirish',
      'multiply': "Ko'paytirish",
      'divide': "Bo'lish",
      'mental': 'Mental arifmetika'
    };
    return names[section] || section;
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    // Create a printable version
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>IQroMax Hisobot - ${format(new Date(), 'dd.MM.yyyy')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #3b82f6; }
          h2 { color: #374151; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f3f4f6; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { color: #6b7280; margin-top: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>IQroMax Platforma Hisoboti</h1>
        <p>Davr: So'nggi ${period} kun | Sana: ${format(new Date(), 'dd.MM.yyyy HH:mm')}</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${totals.users}</div>
            <div class="stat-label">Yangi foydalanuvchilar</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totals.problems.toLocaleString()}</div>
            <div class="stat-label">Yechilgan masalalar</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totals.games.toLocaleString()}</div>
            <div class="stat-label">O'yinlar soni</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${totals.avgScore}</div>
            <div class="stat-label">O'rtacha ball</div>
          </div>
        </div>

        <h2>Top 10 Foydalanuvchilar</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ism</th>
              <th>Ball</th>
              <th>Masalalar</th>
              <th>Eng yaxshi seriya</th>
            </tr>
          </thead>
          <tbody>
            ${topUsers.map((user, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${user.username}</td>
                <td>${user.total_score.toLocaleString()}</td>
                <td>${user.total_problems_solved.toLocaleString()}</td>
                <td>${user.best_streak}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Bo'limlar bo'yicha statistika</h2>
        <table>
          <thead>
            <tr>
              <th>Bo'lim</th>
              <th>O'yinlar soni</th>
              <th>Foiz</th>
            </tr>
          </thead>
          <tbody>
            ${sectionStats.map(s => `
              <tr>
                <td>${s.name}</td>
                <td>${s.count}</td>
                <td>${s.percentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Kunlik statistika</h2>
        <table>
          <thead>
            <tr>
              <th>Sana</th>
              <th>Yangi foydalanuvchilar</th>
              <th>Masalalar</th>
              <th>O'yinlar</th>
            </tr>
          </thead>
          <tbody>
            ${dailyStats.map(d => `
              <tr>
                <td>${d.date}</td>
                <td>${d.users}</td>
                <td>${d.problems}</td>
                <td>${d.games}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>IQroMax Mental Arifmetika Platformasi © ${new Date().getFullYear()}</p>
          <p>Bu hisobot avtomatik ravishda yaratildi</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Batafsil hisobotlar
          </h2>
          <p className="text-sm text-muted-foreground">Platforma statistikasi va tahlillari</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">So'nggi 7 kun</SelectItem>
              <SelectItem value="14">So'nggi 14 kun</SelectItem>
              <SelectItem value="30">So'nggi 30 kun</SelectItem>
              <SelectItem value="90">So'nggi 90 kun</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            PDF eksport
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totals.users}</p>
            <p className="text-xs text-muted-foreground">Yangi foydalanuvchilar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totals.problems.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Yechilgan masalalar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totals.games.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">O'yinlar soni</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totals.avgScore}</p>
            <p className="text-xs text-muted-foreground">O'rtacha ball</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Kunlik faollik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="problems" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Masalalar"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="games" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="O'yinlar"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bo'limlar taqsimoti</CardTitle>
          </CardHeader>
          <CardContent>
            {sectionStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sectionStats}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {sectionStats.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Ma'lumot yo'q
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top 10 Foydalanuvchilar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Ism</TableHead>
                <TableHead className="text-right">Ball</TableHead>
                <TableHead className="text-right">Masalalar</TableHead>
                <TableHead className="text-right">Eng yaxshi seriya</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((user, index) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {user.total_score.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{user.total_problems_solved.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{user.best_streak}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily Stats Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kunlik yangi foydalanuvchilar</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Foydalanuvchilar" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
