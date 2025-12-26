import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaderboard } from '@/components/Leaderboard';
import { useSound } from '@/hooks/useSound';
import { ArrowLeft, Trophy, BarChart3, Target, Flame, Clock, TrendingUp } from 'lucide-react';
import { getSectionInfo } from '@/lib/mathGenerator';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
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
        setProfile(profileData);
      }

      // Fetch game sessions
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (sessionsData) {
        setSessions(sessionsData);
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
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
            <h1 className="text-2xl font-display font-bold">Dashboard</h1>
            <div className="w-20" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Jami ball</p>
                  <p className="text-3xl font-display font-bold text-primary">
                    {profile?.total_score || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-sm text-muted-foreground">Yechilgan misollar</p>
                  <p className="text-3xl font-display font-bold text-accent">
                    {profile?.total_problems_solved || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Flame className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <p className="text-sm text-muted-foreground">Eng uzun seriya</p>
                  <p className="text-3xl font-display font-bold text-warning">
                    {profile?.best_streak || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p className="text-sm text-muted-foreground">O'rtacha aniqlik</p>
                  <p className="text-3xl font-display font-bold text-success">
                    {stats.avgAccuracy}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for history and leaderboard */}
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tarix
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Reyting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">O'yin tarixi</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Hali o'yin o'ynalmagan</p>
                      <Button variant="game" className="mt-4" onClick={() => navigate('/')}>
                        Boshlash
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">
                              {getSectionInfo(session.section as any).icon}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {getSectionInfo(session.section as any).name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(session.created_at).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">+{session.score}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.correct}/{session.correct + session.incorrect} to'g'ri
                            </p>
                          </div>
                        </div>
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
