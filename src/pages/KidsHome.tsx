import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { GuestDashboard } from '@/components/GuestDashboard';
import { Footer } from '@/components/Footer';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useSound } from '@/hooks/useSound';
import { useAdaptiveGamification } from '@/hooks/useAdaptiveGamification';
import { useGameCurrency } from '@/hooks/useGameCurrency';
import { useConfetti } from '@/hooks/useConfetti';
import { toast } from 'sonner';

// New home components
import { AvatarBlock } from '@/components/home/AvatarBlock';
import { MotivationalGreeting } from '@/components/home/MotivationalGreeting';
import { BigStartButton } from '@/components/home/BigStartButton';
import { XPProgressPath } from '@/components/home/XPProgressPath';
import { QuickStats } from '@/components/home/QuickStats';
import { DailyMissionCard } from '@/components/home/DailyMissionCard';
import { WeeklyRankingPreview } from '@/components/home/WeeklyRankingPreview';

interface Profile {
  username: string;
  avatar_url: string | null;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  current_streak: number;
  daily_goal: number;
  vip_expires_at: string | null;
}

interface TodayStats {
  problems: number;
  score: number;
}

const KidsHome = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound, playSound } = useSound();
  const { triggerAchievementConfetti } = useConfetti();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({ problems: 0, score: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyStep, setDailyStep] = useState(0);

  // Gamification
  const gamification = useAdaptiveGamification({
    gameType: 'home',
    enabled: !!user,
  });

  // Game currency (coins, lives)
  const gameCurrency = useGameCurrency();

  // Check if user is VIP
  const isVip = profile?.vip_expires_at 
    ? new Date(profile.vip_expires_at) > new Date() 
    : false;

  // Load user data
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }

    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setProfile({
            username: profileData.username,
            avatar_url: profileData.avatar_url,
            total_score: profileData.total_score || 0,
            total_problems_solved: profileData.total_problems_solved || 0,
            best_streak: profileData.best_streak || 0,
            current_streak: profileData.current_streak || 0,
            daily_goal: profileData.daily_goal || 20,
            vip_expires_at: profileData.vip_expires_at,
          });
        }

        // Fetch today's stats
        const today = new Date().toISOString().split('T')[0];
        const { data: sessionsData } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (sessionsData) {
          const problems = sessionsData.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
          const score = sessionsData.reduce((sum, s) => sum + (s.score || 0), 0);
          setTodayStats({ problems, score });
          
          // Calculate daily step (every 5 problems = 1 step, max 5)
          setDailyStep(Math.min(Math.floor(problems / 5), 5));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        total_score: profileData.total_score || 0,
        total_problems_solved: profileData.total_problems_solved || 0,
        best_streak: profileData.best_streak || 0,
        current_streak: profileData.current_streak || 0,
        daily_goal: profileData.daily_goal || 20,
        vip_expires_at: profileData.vip_expires_at,
      });
    }

    gamification.reload?.();
  }, [user, gamification]);

  // Start game handler
  const handleStartGame = () => {
    playSound?.('start');
    navigate('/train');
  };

  // Start battle handler
  const handleStartBattle = () => {
    playSound?.('start');
    navigate('/train?tab=multiplayer');
  };

  // View all rankings
  const handleViewAllRankings = () => {
    navigate('/train?tab=leaderboard');
  };

  // Claim daily reward
  const handleClaimDailyReward = () => {
    triggerAchievementConfetti();
    playSound?.('complete');
    toast.success('Tabriklaymiz! 🎉', {
      description: '+50 coin va +100 XP qo\'shildi!',
    });
    // Reset daily step
    setDailyStep(0);
  };

  // Start mission
  const handleStartMission = (missionId: string) => {
    playSound?.('start');
    navigate('/train');
  };

  // Claim mission reward
  const handleClaimMissionReward = (missionId: string) => {
    triggerAchievementConfetti();
    playSound?.('correct');
    toast.success('Missiya bajarildi! 🎯');
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  // Guest view
  if (!user) {
    return (
      <PageBackground className="flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-6">
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
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

        <main className="flex-1">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/15 dark:via-background dark:to-accent/15">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/20 to-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
            </div>

            <div className="container px-4 py-6 sm:py-8 relative">
              <div className="max-w-lg mx-auto space-y-6">
                {/* Avatar Block */}
                <div className="animate-fade-in">
                  <AvatarBlock
                    username={profile?.username || 'O\'yinchi'}
                    level={gamification.level}
                    avatarUrl={profile?.avatar_url}
                    levelTitle=""
                    isVip={isVip}
                  />
                </div>

                {/* Motivational Greeting */}
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <MotivationalGreeting
                    username={profile?.username || 'O\'yinchi'}
                    streak={profile?.current_streak || 0}
                    todayProblems={todayStats.problems}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container px-4 py-6 sm:py-8">
            <div className="max-w-lg mx-auto space-y-6">
              {/* Quick Stats */}
              <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                <QuickStats
                  todayProblems={todayStats.problems}
                  todayScore={todayStats.score}
                  streak={profile?.current_streak || 0}
                  energy={gamification.energy}
                  maxEnergy={gamification.maxEnergy}
                  lives={gameCurrency?.lives || 5}
                  maxLives={gameCurrency?.maxLives || 5}
                  coins={gameCurrency?.coins || 0}
                />
              </div>

              {/* XP Progress Path */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <XPProgressPath
                  currentStep={dailyStep}
                  totalSteps={5}
                  xpCurrent={gamification.currentXp}
                  xpRequired={gamification.requiredXp}
                  onClaimReward={handleClaimDailyReward}
                />
              </div>

              {/* Big Start Button */}
              <div className="animate-fade-in py-4" style={{ animationDelay: '250ms' }}>
                <BigStartButton
                  onClick={handleStartGame}
                  variant="start"
                  energy={gamification.energy}
                  disabled={gamification.energy <= 0}
                />
              </div>

              {/* Battle Button */}
              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <BigStartButton
                  onClick={handleStartBattle}
                  variant="battle"
                  energy={gamification.energy}
                  disabled={gamification.energy <= 0}
                />
              </div>

              {/* Daily Missions */}
              <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
                <DailyMissionCard
                  onStartMission={handleStartMission}
                  onClaimReward={handleClaimMissionReward}
                />
              </div>

              {/* Weekly Ranking Preview */}
              <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <WeeklyRankingPreview onViewAll={handleViewAllRankings} />
              </div>

              {/* Parent Stats (hidden in card) */}
              <div className="animate-fade-in bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4" style={{ animationDelay: '450ms' }}>
                <p className="text-sm text-muted-foreground text-center">
                  📊 Bugun {profile?.username} <span className="font-bold text-primary">{todayStats.problems}</span> misol yechdi, 
                  <span className="font-bold text-primary"> {todayStats.score}</span> ball to'pladi.
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </PageBackground>
    </PullToRefresh>
  );
};

export default KidsHome;
