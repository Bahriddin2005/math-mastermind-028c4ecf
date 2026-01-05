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
import { LevelUpModal } from '@/components/LevelUpModal';

// Home components
import { HeroCharacter } from '@/components/home/HeroCharacter';
import { MainActionButton } from '@/components/home/MainActionButton';
import { QuickActionButtons } from '@/components/home/QuickActionButtons';
import { XPProgressPath } from '@/components/home/XPProgressPath';
import { QuickStats } from '@/components/home/QuickStats';
import { DailyMissionCard } from '@/components/home/DailyMissionCard';
import { WeeklyRankingPreview } from '@/components/home/WeeklyRankingPreview';
import { EnergyReadyBanner } from '@/components/home/EnergyReadyBanner';
import { StreakCalendar } from '@/components/StreakCalendar';
import { AchievementsSystem } from '@/components/AchievementsSystem';

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
  const { triggerAchievementConfetti, triggerLevelUpConfetti } = useConfetti();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats>({ problems: 0, score: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyStep, setDailyStep] = useState(0);
  const [showEnergyBanner, setShowEnergyBanner] = useState(true);

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

  // Load user data and check for onboarding
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

          // Check if user needs onboarding (no avatar selected yet)
          if (!profileData.avatar_url || !profileData.avatar_url.startsWith('avatar:')) {
            // Redirect to avatar selection for new users
            navigate('/avatar-select');
            return;
          }
        } else {
          // No profile at all, redirect to avatar selection
          navigate('/avatar-select');
          return;
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
  }, [user, authLoading, navigate]);

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

  // Navigation handlers
  const handleBattle = () => {
    playSound?.('start');
    navigate('/train?tab=multiplayer');
  };

  const handleFriends = () => navigate('/settings?tab=friends');
  const handleRanking = () => navigate('/train?tab=leaderboard');
  const handleLearn = () => navigate('/courses');

  // Claim daily reward
  const handleClaimDailyReward = () => {
    triggerLevelUpConfetti();
    playSound?.('complete');
    toast.success('🎉 Ajoyib! Sovrin qo\'shildi!', {
      description: '+50 tanga va +100 XP oldingiz!',
    });
    setDailyStep(0);
  };

  // Mission handlers
  const handleStartMission = (missionId: string) => {
    playSound?.('start');
    navigate('/train');
  };

  const handleClaimMissionReward = (missionId: string) => {
    triggerAchievementConfetti();
    playSound?.('correct');
    toast.success('🎯 Missiya bajarildi!');
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-emerald-400 animate-pulse flex items-center justify-center">
            <span className="text-4xl">🧠</span>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Yuklanmoqda...</p>
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

        {/* Energy Ready Banner */}
        {showEnergyBanner && (
          <EnergyReadyBanner
            energy={gamification.energy}
            maxEnergy={gamification.maxEnergy}
            onStart={handleStartGame}
            onDismiss={() => setShowEnergyBanner(false)}
          />
        )}

        <main className="flex-1">
          {/* Hero Section with Character */}
          <div className="relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background">
              {/* Floating particles */}
              <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-amber-400/30 animate-float" style={{ animationDelay: '0s' }} />
              <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-purple-400/30 animate-float" style={{ animationDelay: '1s' }} />
              <div className="absolute top-40 left-1/4 w-2 h-2 rounded-full bg-cyan-400/30 animate-float" style={{ animationDelay: '2s' }} />
              <div className="absolute top-32 right-1/3 w-3 h-3 rounded-full bg-emerald-400/30 animate-float" style={{ animationDelay: '0.5s' }} />
            </div>

            <div className="container px-4 py-8 sm:py-12 relative">
              <div className="max-w-lg mx-auto">
                {/* Hero Character */}
                <div className="animate-bounce-in">
                  <HeroCharacter
                    username={profile?.username || "O'yinchi"}
                    level={gamification.level}
                    avatarUrl={profile?.avatar_url}
                    characterType="wizard"
                    isVip={isVip}
                    streak={profile?.current_streak || 0}
                    onAvatarClick={() => navigate('/settings')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container px-4 py-4 sm:py-6">
            <div className="max-w-lg mx-auto space-y-6">
              
              {/* MAIN START BUTTON - The most important element */}
              <MainActionButton
                onClick={handleStartGame}
                disabled={gamification.energy <= 0}
                energy={gamification.energy}
                maxEnergy={gamification.maxEnergy}
              />

              {/* Quick Action Buttons */}
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <QuickActionButtons
                  onBattle={handleBattle}
                  onFriends={handleFriends}
                  onRanking={handleRanking}
                  onLearn={handleLearn}
                />
              </div>

              {/* Quick Stats */}
              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
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
              <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <XPProgressPath
                  currentStep={dailyStep}
                  totalSteps={5}
                  xpCurrent={gamification.currentXp}
                  xpRequired={gamification.requiredXp}
                  onClaimReward={handleClaimDailyReward}
                />
              </div>

              {/* Daily Missions */}
              <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                <DailyMissionCard
                  onStartMission={handleStartMission}
                  onClaimReward={handleClaimMissionReward}
                />
              </div>

              {/* Weekly Ranking Preview */}
              <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                <WeeklyRankingPreview onViewAll={handleRanking} />
              </div>

              {/* Streak Calendar - Compact */}
              <div className="animate-fade-in" style={{ animationDelay: '650ms' }}>
                <StreakCalendar compact />
              </div>

              {/* Achievements - Compact */}
              <div className="animate-fade-in" style={{ animationDelay: '700ms' }}>
                <AchievementsSystem 
                  stats={{
                    totalProblems: profile?.total_problems_solved || 0,
                    currentStreak: profile?.current_streak || 0,
                    bestStreak: profile?.best_streak || 0,
                    totalScore: profile?.total_score || 0,
                    level: gamification.level,
                    totalXp: gamification.totalXp,
                  }}
                />
              </div>

              {/* Parent Stats Card */}
              <div className="animate-fade-in bg-gradient-to-r from-primary/5 to-accent/5 backdrop-blur-sm rounded-2xl border border-border/30 p-4" style={{ animationDelay: '750ms' }}>
                <p className="text-sm text-center">
                  📊 Bugun <span className="font-bold text-primary">{profile?.username}</span> {' '}
                  <span className="font-bold text-primary">{todayStats.problems}</span> misol yechdi, {' '}
                  <span className="font-bold text-accent">{todayStats.score}</span> ball to'pladi.
                  {todayStats.problems > 0 && (
                    <span className="text-muted-foreground"> Zo'r harakat! 💪</span>
                  )}
                </p>
              </div>

            </div>
          </div>
        </main>

        <Footer />

        {/* Level Up Modal */}
        <LevelUpModal
          isOpen={gamification.showLevelUpModal}
          onClose={gamification.closeLevelUpModal}
          newLevel={gamification.newLevelForModal}
          rewards={gamification.levelUpRewards}
        />
      </PageBackground>
    </PullToRefresh>
  );
};

export default KidsHome;
