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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Play,
  Timer,
  BarChart3,
  Zap,
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [todaySolved, setTodaySolved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

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
  }, [user, navigate]);

  const getSessionStats = () => {
    if (sessions.length === 0) return { totalGames: 0, avgAccuracy: 0, totalCorrect: 0 };

    const totalGames = sessions.length;
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct, 0);
    const totalProblems = sessions.reduce((sum, s) => sum + s.correct + s.incorrect, 0);
    const avgAccuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;

    return { totalGames, avgAccuracy, totalCorrect };
  };

  const stats = getSessionStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Welcome Hero */}
          <WelcomeHero username={profile?.username} />

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

          {/* Feature Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-display font-bold text-foreground opacity-0 animate-slide-up" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
              Tez kirish
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Tabs for History & Leaderboard */}
          <Tabs defaultValue="history" className="w-full opacity-0 animate-slide-up" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
            <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-secondary/50">
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md"
              >
                <Zap className="h-4 w-4" />
                Tarix
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md"
              >
                <Trophy className="h-4 w-4" />
                Reyting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <Card className="border-border/40 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    So'nggi o'yinlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Hali o'yin o'ynalmagan
                      </p>
                      <Button variant="default" onClick={() => navigate('/')}>
                        <Play className="h-4 w-4 mr-2" />
                        Birinchi o'yinni boshlash
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
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

            <TabsContent value="leaderboard" className="mt-4">
              <Leaderboard currentUserId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
