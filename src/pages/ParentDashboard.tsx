import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ParentEmailSettings } from '@/components/ParentEmailSettings';
import { PageSkeleton } from '@/components/PageSkeleton';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Trophy,
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  Star,
  ArrowRight,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Medal,
  BookOpen,
  Video,
  PlayCircle
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface ChildStats {
  username: string;
  avatar_url: string | null;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  current_streak: number;
  daily_goal: number;
}

interface GamificationData {
  level: number;
  current_xp: number;
  total_xp: number;
  energy: number;
  combo: number;
  max_combo: number;
  total_correct: number;
  total_incorrect: number;
}

interface DailyStats {
  date: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
}

interface WeeklyComparison {
  thisWeek: { correct: number; total: number; accuracy: number };
  lastWeek: { correct: number; total: number; accuracy: number };
  improvement: number;
}

interface LessonMonitoring {
  totalLessons: number;
  completedLessons: number;
  totalWatchedMinutes: number;
  recentLessons: {
    id: string;
    title: string;
    course_title: string;
    watched_seconds: number;
    completed: boolean;
  }[];
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<WeeklyComparison | null>(null);
  const [todaySolved, setTodaySolved] = useState(0);
  const [lessonMonitoring, setLessonMonitoring] = useState<LessonMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setChildStats({
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        total_score: profileData.total_score || 0,
        total_problems_solved: profileData.total_problems_solved || 0,
        best_streak: profileData.best_streak || 0,
        current_streak: profileData.current_streak || 0,
        daily_goal: profileData.daily_goal || 20,
      });
    }

    // Fetch gamification
    const { data: gamificationData } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gamificationData) {
      setGamification({
        level: gamificationData.level,
        current_xp: gamificationData.current_xp,
        total_xp: gamificationData.total_xp,
        energy: gamificationData.energy,
        combo: gamificationData.combo,
        max_combo: gamificationData.max_combo,
        total_correct: gamificationData.total_correct,
        total_incorrect: gamificationData.total_incorrect,
      });
    }

    // Fetch last 7 days stats
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });

    const { data: sessionsData } = await supabase
      .from('game_sessions')
      .select('created_at, correct, incorrect')
      .eq('user_id', user.id)
      .gte('created_at', last7Days[0]);

    // Process daily stats
    const dailyMap = new Map<string, { correct: number; incorrect: number }>();
    last7Days.forEach(date => dailyMap.set(date, { correct: 0, incorrect: 0 }));

    sessionsData?.forEach(session => {
      const date = format(new Date(session.created_at), 'yyyy-MM-dd');
      if (dailyMap.has(date)) {
        const current = dailyMap.get(date)!;
        dailyMap.set(date, {
          correct: current.correct + (session.correct || 0),
          incorrect: current.incorrect + (session.incorrect || 0),
        });
      }
    });

    const processedDailyStats: DailyStats[] = last7Days.map(date => {
      const stats = dailyMap.get(date)!;
      const total = stats.correct + stats.incorrect;
      return {
        date,
        correct: stats.correct,
        incorrect: stats.incorrect,
        total,
        accuracy: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
      };
    });

    setDailyStats(processedDailyStats);

    // Calculate today's solved
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStats = processedDailyStats.find(s => s.date === today);
    setTodaySolved(todayStats?.correct || 0);

    // Weekly comparison
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekStart, 1);

    const { data: thisWeekData } = await supabase
      .from('game_sessions')
      .select('correct, incorrect')
      .eq('user_id', user.id)
      .gte('created_at', format(thisWeekStart, 'yyyy-MM-dd'));

    const { data: lastWeekData } = await supabase
      .from('game_sessions')
      .select('correct, incorrect')
      .eq('user_id', user.id)
      .gte('created_at', format(lastWeekStart, 'yyyy-MM-dd'))
      .lt('created_at', format(thisWeekStart, 'yyyy-MM-dd'));

    const thisWeekStats = {
      correct: thisWeekData?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0,
      total: thisWeekData?.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0) || 0,
      accuracy: 0,
    };
    thisWeekStats.accuracy = thisWeekStats.total > 0 
      ? Math.round((thisWeekStats.correct / thisWeekStats.total) * 100) 
      : 0;

    const lastWeekStats = {
      correct: lastWeekData?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0,
      total: lastWeekData?.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0) || 0,
      accuracy: 0,
    };
    lastWeekStats.accuracy = lastWeekStats.total > 0 
      ? Math.round((lastWeekStats.correct / lastWeekStats.total) * 100) 
      : 0;

    const improvement = lastWeekStats.accuracy > 0 
      ? thisWeekStats.accuracy - lastWeekStats.accuracy 
      : thisWeekStats.accuracy;

    setWeeklyComparison({
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      improvement,
    });

    // Fetch lesson monitoring data
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, course_id, courses!inner(title)')
      .eq('is_published', true);

    const { data: progressData } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed, watched_seconds')
      .eq('user_id', user.id);

    const progressMap = new Map(
      progressData?.map(p => [p.lesson_id, p]) || []
    );

    const totalLessons = lessons?.length || 0;
    const completedLessons = progressData?.filter(p => p.completed).length || 0;
    const totalWatchedSeconds = progressData?.reduce((sum, p) => sum + (p.watched_seconds || 0), 0) || 0;

    const recentLessons = (lessons || [])
      .map(l => {
        const progress = progressMap.get(l.id);
        return {
          id: l.id,
          title: l.title,
          course_title: (l.courses as any)?.title || '',
          watched_seconds: progress?.watched_seconds || 0,
          completed: progress?.completed || false
        };
      })
      .filter(l => l.watched_seconds > 0 || l.completed)
      .sort((a, b) => b.watched_seconds - a.watched_seconds)
      .slice(0, 5);

    setLessonMonitoring({
      totalLessons,
      completedLessons,
      totalWatchedMinutes: Math.floor(totalWatchedSeconds / 60),
      recentLessons
    });

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/auth');
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, fetchData, navigate]);

  const handleRefresh = async () => {
    await fetchData();
  };

  // Generate recommendations based on data
  const getRecommendations = () => {
    const recommendations: { icon: typeof Lightbulb; text: string; type: 'success' | 'warning' | 'info' }[] = [];

    if (!childStats || !gamification) return recommendations;

    const dailyProgress = (todaySolved / childStats.daily_goal) * 100;
    const accuracy = gamification.total_correct + gamification.total_incorrect > 0
      ? (gamification.total_correct / (gamification.total_correct + gamification.total_incorrect)) * 100
      : 0;

    if (dailyProgress < 50) {
      recommendations.push({
        icon: Target,
        text: `Bugun yana ${childStats.daily_goal - todaySolved} ta masala yechish kerak`,
        type: 'warning',
      });
    } else if (dailyProgress >= 100) {
      recommendations.push({
        icon: CheckCircle2,
        text: "Kunlik maqsad bajarildi! 🎉",
        type: 'success',
      });
    }

    if (accuracy < 70) {
      recommendations.push({
        icon: Brain,
        text: "Osonroq masalalardan boshlash tavsiya etiladi",
        type: 'info',
      });
    } else if (accuracy >= 90) {
      recommendations.push({
        icon: TrendingUp,
        text: "Ajoyib natija! Qiyinroq darajaga o'tish mumkin",
        type: 'success',
      });
    }

    if (childStats.current_streak >= 3) {
      recommendations.push({
        icon: Flame,
        text: `${childStats.current_streak} kunlik streak! Davom eting!`,
        type: 'success',
      });
    } else if (childStats.current_streak === 0) {
      recommendations.push({
        icon: AlertCircle,
        text: "Bugun mashq qilish streak boshlashga yordam beradi",
        type: 'warning',
      });
    }

    return recommendations;
  };

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <PageSkeleton type="default" />
      </PageBackground>
    );
  }

  if (!childStats) {
    return (
      <PageBackground className="min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <div className="container px-4 py-8 text-center">
          <p className="text-muted-foreground">Ma'lumot topilmadi</p>
        </div>
      </PageBackground>
    );
  }

  const dailyProgress = (todaySolved / childStats.daily_goal) * 100;
  const accuracy = gamification && gamification.total_correct + gamification.total_incorrect > 0
    ? Math.round((gamification.total_correct / (gamification.total_correct + gamification.total_incorrect)) * 100)
    : 0;
  const recommendations = getRecommendations();
  const level = gamification?.level || 1;
  const xpProgress = gamification ? Math.min((gamification.current_xp / (level * 100)) * 100, 100) : 0;

  return (
    <PageBackground className="min-h-screen pb-20 sm:pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-3 xs:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Xush kelibsiz! 👋
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Farzandingiz rivojini shu yerda kuzatishingiz mumkin
              </p>
            </div>
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              {childStats.avatar_url ? (
                <img src={childStats.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
              ) : (
                <span className="text-xl sm:text-2xl font-black text-white">{level}</span>
              )}
            </div>
          </div>

          {/* Child Info Card */}
          <Card className="border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/60 to-white dark:from-blue-950/20 dark:to-card">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <span className="text-2xl">👶</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Farzand</p>
                  <p className="font-display font-bold text-base sm:text-lg">{childStats.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Daraja</p>
                  <p className="font-display font-bold text-lg sm:text-xl text-primary">{level}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Progress Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                📊 Bugungi mashg'ulotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-display font-bold text-primary">{todaySolved}</span>
                  <span className="text-lg sm:text-xl text-muted-foreground">/{childStats.daily_goal}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm sm:text-base font-semibold text-foreground">{Math.round(dailyProgress)}%</span>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">bajarildi</p>
                </div>
              </div>
              <Progress value={dailyProgress} className="h-2.5 sm:h-3" />
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                <div className="text-center p-2 sm:p-3 rounded-lg bg-card/50">
                  <div className="flex items-center justify-center gap-1 text-kid-yellow">
                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                    <span className="text-sm sm:text-base font-bold">{gamification?.current_xp || 0}</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">XP</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-card/50">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                    <span className="text-sm sm:text-base font-bold">{level}</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Daraja</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-card/50">
                  <div className="flex items-center justify-center gap-1 text-kid-orange">
                    <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base font-bold">{childStats.current_streak}</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-kid-yellow" />
                  💡 Tavsiyalar
                </CardTitle>
                <p className="text-xs text-muted-foreground">📌 Bugun foydali bo'ladi</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg ${
                      rec.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                      rec.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'bg-blue-500/10 border border-blue-500/20'
                    }`}
                  >
                    <rec.icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${
                      rec.type === 'success' ? 'text-emerald-500' :
                      rec.type === 'warning' ? 'text-amber-500' :
                      'text-blue-500'
                    }`} />
                    <span className="text-xs sm:text-sm">{rec.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Weekly Comparison */}
          {weeklyComparison && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  📈 Rivojlanish ko'rsatkichlari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Bu hafta</p>
                    <div className="text-xl sm:text-2xl font-display font-bold text-foreground">
                      {weeklyComparison.thisWeek.correct}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      to'g'ri ({weeklyComparison.thisWeek.accuracy}%)
                    </p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">O'tgan hafta</p>
                    <div className="text-xl sm:text-2xl font-display font-bold text-muted-foreground">
                      {weeklyComparison.lastWeek.correct}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      to'g'ri ({weeklyComparison.lastWeek.accuracy}%)
                    </p>
                  </div>
                </div>
                
                <div className={`mt-3 p-2.5 sm:p-3 rounded-lg flex items-center gap-2 ${
                  weeklyComparison.improvement >= 0 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}>
                  {weeklyComparison.improvement >= 0 ? (
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  )}
                  <span className="text-xs sm:text-sm font-medium">
                    {weeklyComparison.improvement >= 0 ? '+' : ''}{weeklyComparison.improvement}% 
                    {weeklyComparison.improvement >= 0 ? ' yaxshilandi' : ' pasaydi'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last 7 Days */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                📅 Kunlik hisobot
              </CardTitle>
              <p className="text-xs text-muted-foreground">Oxirgi 7 kunlik mashg'ulotlar</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dailyStats.map((day, index) => {
                  const dayName = format(new Date(day.date), 'EEEE');
                  const isToday = day.date === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <div 
                      key={day.date}
                      className={`flex items-center gap-3 p-2 sm:p-2.5 rounded-lg ${
                        isToday ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/30'
                      }`}
                    >
                      <div className="w-16 sm:w-20 shrink-0">
                        <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                          {isToday ? 'Bugun' : dayName.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 sm:h-2 bg-secondary/80 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                              style={{ width: `${day.accuracy}%` }}
                            />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium w-8 text-right">
                            {day.accuracy}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs sm:text-sm font-medium text-emerald-500">{day.correct}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">/</span>
                        <span className="text-xs sm:text-sm font-medium text-red-500">{day.incorrect}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="p-3 sm:p-4 border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                <span className="text-xs sm:text-sm font-medium">Umumiy to'g'ri</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-emerald-500">
                {gamification?.total_correct || 0}
              </div>
            </Card>
            <Card className="p-3 sm:p-4 border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Aniqlik</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-primary">
                {accuracy}%
              </div>
            </Card>
            <Card className="p-3 sm:p-4 border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-kid-yellow" />
                <span className="text-xs sm:text-sm font-medium">Eng yaxshi streak</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-kid-yellow">
                {childStats.best_streak}
              </div>
            </Card>
            <Card className="p-3 sm:p-4 border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-kid-purple" />
                <span className="text-xs sm:text-sm font-medium">Umumiy XP</span>
              </div>
              <div className="text-xl sm:text-2xl font-display font-bold text-kid-purple">
                {gamification?.total_xp || 0}
              </div>
            </Card>
          </div>

          {/* Lesson Monitoring */}
          {lessonMonitoring && (
            <Card className="border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Dars ko'rish monitoringi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lesson Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-primary/10">
                    <div className="flex items-center justify-center gap-1 text-primary">
                      <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-sm sm:text-base font-bold">{lessonMonitoring.completedLessons}</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Tugatilgan</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-kid-purple/10">
                    <div className="flex items-center justify-center gap-1 text-kid-purple">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-sm sm:text-base font-bold">{lessonMonitoring.totalWatchedMinutes}</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">daqiqa</p>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-emerald-500/10">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-sm sm:text-base font-bold">
                        {lessonMonitoring.totalLessons > 0 
                          ? Math.round((lessonMonitoring.completedLessons / lessonMonitoring.totalLessons) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Progress</p>
                  </div>
                </div>

                {/* Recent Lessons */}
                {lessonMonitoring.recentLessons.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Oxirgi ko'rilgan darslar:</p>
                    {lessonMonitoring.recentLessons.map(lesson => (
                      <div 
                        key={lesson.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                      >
                        <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          lesson.completed ? 'bg-emerald-500' : 'bg-primary/20'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{lesson.title}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{lesson.course_title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                            {Math.floor(lesson.watched_seconds / 60)} daqiqa
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lessonMonitoring.recentLessons.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Hali darslar ko'rilmagan</p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/lesson-stats')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Batafsil statistika
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          <div className="mt-6">
            <h3 className="font-display font-bold text-base sm:text-lg mb-4 flex items-center gap-2">
              📧 Email sozlamalari
            </h3>
            <ParentEmailSettings />
          </div>

          {/* Quick Actions */}
          <Card className="p-4 sm:p-5 border-border/40 bg-gradient-to-br from-primary/5 to-accent/5">
            <h3 className="font-display font-bold text-sm sm:text-base mb-3">Tezkor harakatlar</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate('/statistics')}
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs">Batafsil statistika</span>
              </Button>
              <Button 
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => navigate('/badges')}
              >
                <Medal className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs">Nishonlar</span>
              </Button>
            </div>
          </Card>
        </div>
      </PullToRefresh>
    </PageBackground>
  );
};

export default ParentDashboard;
