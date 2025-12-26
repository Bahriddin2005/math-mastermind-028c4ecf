import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { WelcomeHero } from '@/components/WelcomeHero';
import { FeatureCard } from '@/components/FeatureCard';
import { StatsCard } from '@/components/StatsCard';
import { DailyGoals } from '@/components/DailyGoals';
import { Achievements } from '@/components/Achievements';
import { StatsCharts } from '@/components/StatsCharts';
import { GameHistoryItem } from '@/components/GameHistoryItem';
import { Leaderboard } from '@/components/Leaderboard';
import { InfoCarousel } from '@/components/InfoCarousel';
import { GuestDashboard } from '@/components/GuestDashboard';
import { Footer } from '@/components/Footer';
import { MentalArithmeticPractice } from '@/components/MentalArithmeticPractice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';
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
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [todaySolved, setTodaySolved] = useState(0);
  const [loading, setLoading] = useState(true);

  // Achievement notifications hook
  useAchievementNotifications({
    totalProblems: profile?.total_problems_solved || 0,
    bestStreak: profile?.best_streak || 0,
    totalScore: profile?.total_score || 0,
    enabled: !!user,
  });

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

        // Calculate today's solved problems
        const today = new Date().toISOString().split('T')[0];
        const todayProblems = sessionsData
          .filter(s => s.created_at.startsWith(today))
          .reduce((sum, s) => sum + s.correct + s.incorrect, 0);
        setTodaySolved(todayProblems);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show guest dashboard if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-6 md:py-8">
          <div className="max-w-5xl mx-auto">
            <GuestDashboard />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container px-4 py-8 md:py-12 relative">
            <div className="max-w-5xl mx-auto">
              <WelcomeHero username={profile?.username} />
            </div>
          </div>
        </div>

        <div className="container px-4 py-6 md:py-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Stats Overview - Enhanced Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </div>

            {/* Daily Goals & Achievements Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {user && profile && (
                <DailyGoals
                  userId={user.id}
                  dailyGoal={profile.daily_goal}
                  todaySolved={todaySolved}
                  currentStreak={profile.current_streak}
                  onGoalChange={(newGoal) => setProfile({ ...profile, daily_goal: newGoal })}
                />
              )}
              <Achievements
                totalProblems={profile?.total_problems_solved || 0}
                bestStreak={profile?.best_streak || 0}
                totalScore={profile?.total_score || 0}
                totalGames={stats.totalGames}
              />
            </div>

            {/* Statistics Charts */}
            <StatsCharts sessions={sessions} />

            {/* Quick Access Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">Tez kirish</h2>
                  <p className="text-sm text-muted-foreground">Mashqlarni tanlang va boshlang</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Mental Arifmetika Mashqi */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 opacity-0 animate-slide-up" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">Mental Arifmetika</h2>
                  <p className="text-sm text-muted-foreground">Abacus bilan mashq qiling</p>
                </div>
              </div>
              <MentalArithmeticPractice />
            </div>

            {/* Info Carousel */}
            <InfoCarousel />

            {/* Tabs for History & Leaderboard - Enhanced */}
            <Tabs defaultValue="history" className="w-full opacity-0 animate-slide-up" style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}>
              <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1.5 bg-secondary/60 backdrop-blur-sm">
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2 rounded-xl font-semibold data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Tarix
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="flex items-center gap-2 rounded-xl font-semibold data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary transition-all"
                >
                  <Trophy className="h-4 w-4" />
                  Reyting
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-6">
                <Card className="border-border/40 shadow-md overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-secondary/50 to-transparent">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      So'nggi o'yinlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {sessions.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mx-auto mb-6">
                          <Zap className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-display font-bold text-lg mb-2">Hali o'yin o'ynalmagan</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                          Birinchi mashqingizni yakunlang va natijalaringizni bu yerda ko'ring
                        </p>
                        <Button 
                          variant="default" 
                          size="lg"
                          onClick={() => navigate('/train')}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Birinchi o'yinni boshlash
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
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

              <TabsContent value="leaderboard" className="mt-6">
                <Leaderboard currentUserId={user?.id} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
