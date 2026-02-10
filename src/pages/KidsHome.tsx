import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { PandaMascot } from '@/components/PandaMascot';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Trophy, Zap, Flame, Star, Target, BarChart3, FileText, Users, GraduationCap, Calculator } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { SectionCarousel, kidsSection, parentsSection, teachersSection } from '@/components/SectionCarousel';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';
import { PullToRefresh } from '@/components/PullToRefresh';
import { PageSkeleton } from '@/components/PageSkeleton';
import { GuestDashboard } from '@/components/GuestDashboard';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  daily_goal: number;
  current_streak: number;
  avatar_url: string | null;
}

interface GamificationData {
  level: number;
  current_xp: number;
  energy: number;
  combo: number;
  total_xp: number;
}

const KidsHome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, isParent, isTeacher, isStudent } = useUserRole();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [todaySolved, setTodaySolved] = useState(0);
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
      setProfile({
        username: profileData.username,
        total_score: profileData.total_score || 0,
        total_problems_solved: profileData.total_problems_solved || 0,
        best_streak: profileData.best_streak || 0,
        daily_goal: profileData.daily_goal || 20,
        current_streak: profileData.current_streak || 0,
        avatar_url: profileData.avatar_url,
      });
    }

    // Fetch gamification data
    const { data: gamificationData } = await supabase
      .from('user_gamification')
      .select('level, current_xp, energy, combo, total_xp')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gamificationData) {
      setGamification(gamificationData);
    }

    // Get today's solved problems
    const today = new Date().toISOString().split('T')[0];
    const { data: sessionsData } = await supabase
      .from('game_sessions')
      .select('correct')
      .eq('user_id', user.id)
      .gte('created_at', today);

    const solved = sessionsData?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0;
    setTodaySolved(solved);

    // Celebrate if goal reached
    const goal = profileData?.daily_goal || 20;
    const progress = (solved / goal) * 100;
    
    if (progress >= 100) {
      triggerConfetti('stars');
    }
    
    setLoading(false);
  }, [user, triggerConfetti]);

  useEffect(() => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }

    if (!user) return;
    fetchData();
  }, [user, authLoading, fetchData]);

  const handleRefresh = async () => {
    await fetchData();
  };

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <PageSkeleton type="home" />
      </PageBackground>
    );
  }

  // Show GuestDashboard for non-logged-in users
  if (!user) {
    return (
      <PageBackground className="min-h-screen pb-20 sm:pb-24">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <div className="container px-3 xs:px-4 py-4 sm:py-6">
          <GuestDashboard />
        </div>
      </PageBackground>
    );
  }

  // Calculate progress
  const dailyGoal = profile?.daily_goal || 20;
  const dailyProgress = Math.min((todaySolved / dailyGoal) * 100, 100);
  const level = gamification?.level || 1;
  const currentXP = gamification?.current_xp || 0;
  const requiredXP = level * 120;
  const xpProgress = Math.min((currentXP / requiredXP) * 100, 100);

  return (
    <PageBackground className="min-h-screen pb-20 sm:pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <PullToRefresh onRefresh={handleRefresh}>
        {/* User Stats Card - Only for students and teachers */}
        {!isParent && (
        <div className="container px-3 xs:px-4 py-3 sm:py-4">
          <Card className="p-3 sm:p-4 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Level Badge */}
              <div className="relative">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <span className="text-lg sm:text-xl font-black text-white">{level}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-kid-yellow rounded-full flex items-center justify-center shadow-md">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-800 fill-yellow-600" />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3">
                {/* XP with Level Progress */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-kids-yellow">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                    <span className="text-sm sm:text-base font-bold">{currentXP}/{requiredXP}</span>
                  </div>
                  <div className="h-1.5 bg-secondary/80 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-kids-yellow to-kids-orange rounded-full transition-all"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                    {requiredXP - currentXP} XP qoldi
                  </span>
                </div>

                {/* Daily Goal */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base font-bold">{todaySolved}/{dailyGoal}</span>
                  </div>
                  <div className="h-1.5 bg-secondary/80 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all"
                      style={{ width: `${dailyProgress}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Bugun</span>
                </div>

                {/* Streak/Combo */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-kid-orange">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base font-bold">{profile?.current_streak || 0}</span>
                  </div>
                  <div className="h-1.5 bg-secondary/80 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-gradient-to-r from-kid-orange to-kid-red rounded-full"
                      style={{ width: `${Math.min((profile?.current_streak || 0) * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Streak</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Role-specific content */}
        {isParent ? (
          /* PARENT HOME - Nazorat & Xotirjamlik */
          <div className="container px-3 xs:px-4 space-y-3 py-2">
            <h2 className="text-lg font-bold px-1">👨‍👩‍👧 Ota-ona paneli</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/parent-dashboard')} className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm font-bold">Nazorat paneli</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Farzand rivojlanishi</p>
              </button>
              <button onClick={() => navigate('/lesson-stats')} className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm font-bold">Kunlik hisobot</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Bugungi natijalar</p>
              </button>
              <button onClick={() => navigate('/statistics')} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">📈</div>
                <p className="text-sm font-bold">Rivojlanish</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Grafik va tahlil</p>
              </button>
              <button onClick={() => navigate('/settings')} className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">💡</div>
                <p className="text-sm font-bold">Tavsiyalar</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Yaxshilash yo'llari</p>
              </button>
            </div>
          </div>
        ) : isTeacher ? (
          /* TEACHER HOME - Boshqaruv & Rivojlanish */
          <div className="container px-3 xs:px-4 py-2">
            <TeacherDashboard />
          </div>
        ) : (
          /* STUDENT HOME - O'rganish & Qiziqish */
          <>
            {/* Hero Carousel */}
            <div className="container px-3 xs:px-4 py-2 sm:py-3">
              <HeroCarousel />
            </div>

            {/* Daily Task Card */}
            <div className="container px-3 xs:px-4 py-2">
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">🎯 Bugungi topshiriq</p>
                    <p className="text-xs text-muted-foreground">Tez va aniq hisoblash mashqlari</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 rounded-xl bg-background/60">
                    <p className="text-xs text-muted-foreground">⭐ Yig'ilgan ballar</p>
                    <p className="text-lg font-bold text-primary">{profile?.total_score || 0}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-background/60">
                    <p className="text-xs text-muted-foreground">🏆 Bosqich</p>
                    <p className="text-lg font-bold text-accent">{level}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Action Button */}
            <div className="container px-3 xs:px-4 py-2 sm:py-3">
              <button
                onClick={() => navigate('/train')}
                className="w-full h-14 xs:h-16 sm:h-18 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-xl hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group touch-target"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="text-2xl sm:text-3xl">🟢</span>
                <span className="text-base sm:text-lg font-bold text-white">Boshlash</span>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            {/* Section Carousels */}
            <div className="container px-3 xs:px-4 space-y-2">
              <SectionCarousel {...kidsSection} />
            </div>
          </>
        )}

        {/* Subscription Plans - only for students */}
        {isStudent && (
          <div className="container px-3 xs:px-4">
            <SubscriptionPlans />
          </div>
        )}
      </PullToRefresh>
    </PageBackground>
  );
};

export default KidsHome;