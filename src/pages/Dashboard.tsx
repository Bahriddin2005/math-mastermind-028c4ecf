import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { WelcomeHero } from '@/components/WelcomeHero';
import { FeatureCard } from '@/components/FeatureCard';
import { StatsCard } from '@/components/StatsCard';
import { DailyStats } from '@/components/DailyStats';
import { Achievements } from '@/components/Achievements';
import { StatsCharts } from '@/components/StatsCharts';
import { GameHistoryItem } from '@/components/GameHistoryItem';
import { Leaderboard } from '@/components/Leaderboard';
import { InfoCarousel } from '@/components/InfoCarousel';
import { TestimonialForm } from '@/components/TestimonialForm';
import { GuestDashboard } from '@/components/GuestDashboard';
import { Footer } from '@/components/Footer';

import { WeeklyCompetition } from '@/components/WeeklyCompetition';
import { UserBadges } from '@/components/UserBadges';
import { ProgressVisualization } from '@/components/ProgressVisualization';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
import { useBadgeNotifications } from '@/hooks/useBadgeNotifications';
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Play,
  Timer,
  BarChart3,
  Zap,
  Sparkles,
  GraduationCap,
  Calculator,
  Award,
  Clock,
  Activity,
} from 'lucide-react';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  daily_goal: number;
  current_streak: number;
}

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
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [todayStats, setTodayStats] = useState<PeriodStats>({ score: 0, solved: 0, accuracy: 0, bestStreak: 0, avgTime: 0 });
  const [weekStats, setWeekStats] = useState<PeriodStats>({ score: 0, solved: 0, accuracy: 0, bestStreak: 0, avgTime: 0 });
  const [monthStats, setMonthStats] = useState<PeriodStats>({ score: 0, solved: 0, accuracy: 0, bestStreak: 0, avgTime: 0 });
  const [chartData, setChartData] = useState<{ date: string; score: number; solved: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Achievement notifications hook
  useAchievementNotifications({
    totalProblems: profile?.total_problems_solved || 0,
    bestStreak: profile?.best_streak || 0,
    totalScore: profile?.total_score || 0,
    enabled: !!user,
  });

  // Badge notifications hook (realtime)
  useBadgeNotifications();

  useEffect(() => {
    // If not logged in and auth is done loading, show guest dashboard
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }

    if (!user) return;

    const fetchData = async () => {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          username: profileData.username,
          total_score: profileData.total_score || 0,
          total_problems_solved: profileData.total_problems_solved || 0,
          best_streak: profileData.best_streak || 0,
          daily_goal: profileData.daily_goal || 20,
          current_streak: profileData.current_streak || 0,
        });
      }

      // Fetch all game sessions for charts
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionsData) {
        setSessions(sessionsData);

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Hafta boshidan hisoblash (Dushanba)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Oy boshidan hisoblash
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Helper funksiya statistikani hisoblash uchun
        const calcStats = (filteredSessions: typeof sessionsData): PeriodStats => {
          const problems = filteredSessions.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
          const correct = filteredSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
          const score = filteredSessions.reduce((sum, s) => sum + (s.score || 0), 0);
          const accuracy = problems > 0 ? Math.round((correct / problems) * 100) : 0;
          const bestStreak = filteredSessions.reduce((max, s) => Math.max(max, s.best_streak || 0), 0);
          const totalTime = filteredSessions.reduce((sum, s) => sum + (s.total_time || 0), 0);
          const avgTime = problems > 0 ? totalTime / problems : 0;
          
          return { score, solved: problems, accuracy, bestStreak, avgTime };
        };
        
        // Bugungi statistika
        const todaySessions = sessionsData.filter(s => s.created_at.startsWith(today));
        setTodayStats(calcStats(todaySessions));
        
        // Haftalik statistika
        const weekSessions = sessionsData.filter(s => new Date(s.created_at) >= startOfWeek);
        setWeekStats(calcStats(weekSessions));
        
        // Oylik statistika
        const monthSessions = sessionsData.filter(s => new Date(s.created_at) >= startOfMonth);
        setMonthStats(calcStats(monthSessions));
        
        // Chart data - oxirgi 14 kun
        const dailyData: { [key: string]: { score: number; solved: number } } = {};
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          dailyData[dateStr] = { score: 0, solved: 0 };
        }
        
        sessionsData.forEach(s => {
          const dateStr = s.created_at.split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].score += s.score || 0;
            dailyData[dateStr].solved += (s.correct || 0) + (s.incorrect || 0);
          }
        });
        
        const chartDataArray = Object.entries(dailyData).map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' }),
          score: data.score,
          solved: data.solved
        }));
        
        setChartData(chartDataArray);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    
    // Re-fetch all data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        username: profileData.username,
        total_score: profileData.total_score || 0,
        total_problems_solved: profileData.total_problems_solved || 0,
        best_streak: profileData.best_streak || 0,
        daily_goal: profileData.daily_goal || 20,
        current_streak: profileData.current_streak || 0,
      });
    }

    const { data: sessionsData } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sessionsData) {
      setSessions(sessionsData);
    }
  }, [user]);

  const getSessionStats = () => {
    if (sessions.length === 0) return { totalGames: 0, avgAccuracy: 0, totalCorrect: 0 };

    const totalGames = sessions.length;
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct, 0);
    const totalProblems = sessions.reduce((sum, s) => sum + s.correct + s.incorrect, 0);
    const avgAccuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

    return { totalGames, avgAccuracy, totalCorrect };
  };

  const stats = getSessionStats();

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary/80"></div>
          <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  // Show guest dashboard if not logged in
  if (!user) {
    return (
      <PageBackground className="flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-6 md:py-8">
          <div className="max-w-5xl mx-auto">
            <GuestDashboard />
          </div>
        </main>
        <Footer />
      </PageBackground>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageBackground className="flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1">
        {/* Hero Section with gradient - Dark mode optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/15 dark:via-background dark:to-accent/15">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-br from-primary/20 dark:from-primary/30 to-primary/5 dark:to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-40 -left-40 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-accent/20 dark:from-accent/30 to-accent/5 dark:to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-radial from-primary/5 dark:from-primary/10 to-transparent rounded-full" />
          </div>
          
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="container px-3 sm:px-4 py-8 sm:py-10 md:py-14 relative">
            <div className="max-w-5xl mx-auto">
              <WelcomeHero username={profile?.username} />
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

            {/* Stats Overview - Mobile optimized Grid - Extended with new cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <StatsCard
                icon={Trophy}
                label="Jami ball"
                value={profile?.total_score || 0}
                iconBgColor="primary"
                delay={100}
              />
              <StatsCard
                icon={Target}
                label="Yechilgan"
                value={profile?.total_problems_solved || 0}
                iconBgColor="accent"
                delay={150}
              />
              <StatsCard
                icon={Flame}
                label="Eng uzun seriya"
                value={profile?.best_streak || 0}
                iconBgColor="warning"
                delay={200}
              />
              <StatsCard
                icon={TrendingUp}
                label="Aniqlik"
                value={`${stats.avgAccuracy}%`}
                iconBgColor="success"
                delay={250}
              />
              <StatsCard
                icon={Activity}
                label="O'yinlar soni"
                value={stats.totalGames}
                iconBgColor="accent"
                delay={300}
              />
              <StatsCard
                icon={Clock}
                label="Joriy streak"
                value={profile?.current_streak || 0}
                iconBgColor="primary"
                delay={350}
              />
            </div>

            {/* Daily Stats & Progress Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {user && profile && (
                <DailyStats
                  todayStats={todayStats}
                  weekStats={weekStats}
                  monthStats={monthStats}
                  currentStreak={profile.current_streak}
                  chartData={chartData}
                />
              )}
              {user && profile && (
                <ProgressVisualization
                  dailyGoal={profile.daily_goal || 20}
                  problemsSolved={todayStats.solved}
                  accuracy={todayStats.accuracy}
                  streak={profile.current_streak || 0}
                  level={Math.floor((profile.total_score || 0) / 1000) + 1}
                />
              )}
            </div>

            {/* Achievements */}
            <Achievements
              totalProblems={profile?.total_problems_solved || 0}
              bestStreak={profile?.best_streak || 0}
              totalScore={profile?.total_score || 0}
              totalGames={stats.totalGames}
            />

            {/* Weekly Competition & Badges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <WeeklyCompetition />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: '420ms', animationFillMode: 'forwards' }}>
                <UserBadges />
              </div>
            </div>

            {/* Statistics Charts */}
            <StatsCharts sessions={sessions} />

            {/* Quick Access Section - Dark mode enhanced */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between opacity-0 animate-slide-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shadow-glow dark:shadow-lg dark:shadow-primary/30">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-display font-bold text-foreground dark:text-foreground/95">Tez kirish</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80">Mashqlarni tanlang va boshlang</p>
                  </div>
                </div>
                <div className="hidden sm:block h-px flex-1 mx-6 bg-gradient-to-r from-border dark:from-border/50 to-transparent" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <FeatureCard
                  category="TRENING"
                  title="Mashqni boshlash"
                  description="Darajangizga mos modulni tanlab, mental arifmetika mashqlarini boshlang."
                  buttonText="Boshlash"
                  icon={Play}
                  iconBgColor="primary"
                  onClick={() => navigate('/train')}
                  delay={500}
                />
                <FeatureCard
                  category="VAQT REJIMI"
                  title="Vaqtga qarshi hisob"
                  description="Sanoq tezligini oshirish uchun dinamik timerli mashqlar."
                  buttonText="Sekundomer rejimi"
                  icon={Timer}
                  iconBgColor="accent"
                  onClick={() => navigate('/train')}
                  delay={550}
                />
                <FeatureCard
                  category="VIDEO DARSLAR"
                  title="O'rganishni boshlash"
                  description="Professional video darslar bilan mental arifmetikani o'rganing."
                  buttonText="Darslarni ko'rish"
                  icon={GraduationCap}
                  iconBgColor="success"
                  onClick={() => navigate('/courses')}
                  delay={600}
                />
              </div>
            </div>

            {/* Mental Arifmetika Card - Dark mode enhanced */}
            <Card 
              className="overflow-hidden border-border/40 dark:border-border/20 cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-orange-500/20 transition-all group opacity-0 animate-slide-up"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
              onClick={() => navigate('/mental-arithmetic')}
            >
              <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-amber-500 to-orange-500 dark:from-amber-600/90 dark:to-orange-600/90 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/5 dark:bg-white/3 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-xl sm:rounded-2xl bg-white/20 dark:bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-lg dark:shadow-xl">
                    <Calculator className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold mb-0.5 sm:mb-1 truncate drop-shadow-sm">Mental Arifmetika</h2>
                    <p className="text-xs sm:text-sm opacity-90 dark:opacity-80">Abakus bilan mashq qiling</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 dark:bg-white/15 rounded-lg sm:rounded-xl backdrop-blur-sm shrink-0 shadow-md">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium text-sm sm:text-base">Boshlash</span>
                  </div>
                </div>
                
                <div className="relative z-10 mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
                    <p className="text-base sm:text-lg font-bold">10+</p>
                    <p className="text-[9px] sm:text-[10px] opacity-80 dark:opacity-70">Formulalar</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
                    <p className="text-base sm:text-lg font-bold">⚡</p>
                    <p className="text-[9px] sm:text-[10px] opacity-80 dark:opacity-70">Flash-kartalar</p>
                  </div>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10">
                    <p className="text-base sm:text-lg font-bold">🏆</p>
                    <p className="text-[9px] sm:text-[10px] opacity-80 dark:opacity-70">Multiplayer</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Info Carousel & Testimonial Form */}
            <div className="space-y-4">
              <InfoCarousel />
              <div className="flex justify-center opacity-0 animate-slide-up" style={{ animationDelay: '620ms', animationFillMode: 'forwards' }}>
                <TestimonialForm />
              </div>
            </div>

            {/* Tabs for History & Leaderboard - Mobile optimized & Dark mode enhanced */}
            <Tabs defaultValue="history" className="w-full opacity-0 animate-slide-up" style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}>
              <TabsList className="grid w-full grid-cols-2 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 bg-secondary/60 dark:bg-secondary/30 backdrop-blur-sm border border-border/30 dark:border-border/20">
                <TabsTrigger
                  value="history"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-card dark:data-[state=active]:bg-card/80 data-[state=active]:shadow-md dark:data-[state=active]:shadow-lg dark:data-[state=active]:shadow-primary/15 data-[state=active]:text-primary transition-all py-2.5 sm:py-2.5"
                >
                  <Zap className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span>Tarix</span>
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-card dark:data-[state=active]:bg-card/80 data-[state=active]:shadow-md dark:data-[state=active]:shadow-lg dark:data-[state=active]:shadow-primary/15 data-[state=active]:text-primary transition-all py-2.5 sm:py-2.5"
                >
                  <Trophy className="h-4 w-4 sm:h-4 sm:w-4" />
                  <span>Reyting</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-3 sm:mt-4 md:mt-6">
                <Card className="border-border/40 dark:border-border/20 shadow-md dark:shadow-xl dark:shadow-primary/5 overflow-hidden bg-card dark:bg-card/80">
                  <CardHeader className="pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-secondary/50 dark:from-secondary/20 to-transparent">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 sm:gap-3 text-foreground dark:text-foreground/95">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-lg bg-primary/10 dark:bg-primary/25 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                      </div>
                      So'nggi o'yinlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2 sm:pt-3 md:pt-4 px-2 sm:px-3 md:px-6 pb-3 sm:pb-4 md:pb-6">
                    {sessions.length === 0 ? (
                      <div className="text-center py-8 sm:py-10 md:py-16">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 dark:from-secondary/40 dark:to-secondary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 border border-border/30 dark:border-border/20">
                          <Zap className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 text-muted-foreground dark:text-muted-foreground/80" />
                        </div>
                        <h3 className="font-display font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 text-foreground dark:text-foreground/95">Hali o'yin o'ynalmagan</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80 mb-3 sm:mb-4 md:mb-6 max-w-sm mx-auto px-4">
                          Birinchi mashqingizni yakunlang va natijalaringizni bu yerda ko'ring
                        </p>
                        <Button 
                          variant="default" 
                          size="lg"
                          onClick={() => navigate('/train')}
                          className="gap-2 h-11 sm:h-12 md:h-10 text-sm sm:text-base px-6 sm:px-8 shadow-lg dark:shadow-primary/20"
                        >
                          <Play className="h-4 w-4" />
                          Birinchi o'yinni boshlash
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-2 md:space-y-3 max-h-[350px] sm:max-h-[400px] md:max-h-[450px] overflow-y-auto pr-1 sm:pr-2">
                        {sessions.slice(0, 10).map((session, index) => (
                          <GameHistoryItem
                            key={session.id}
                            section={session.section}
                            correct={session.correct}
                            incorrect={session.incorrect}
                            score={session.score}
                            createdAt={session.created_at}
                            delay={index * 50}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard" className="mt-4 sm:mt-6">
                <Leaderboard currentUserId={user?.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
    </PullToRefresh>
  );
};

export default Dashboard;
