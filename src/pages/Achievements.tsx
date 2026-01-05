import { useState, useEffect } from 'react';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { AchievementsSystem } from '@/components/AchievementsSystem';
import { StreakCalendar } from '@/components/StreakCalendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Achievements = () => {
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    total_problems_solved: number;
    best_streak: number;
    current_streak: number;
    total_score: number;
  } | null>(null);
  const [gamification, setGamification] = useState<{
    level: number;
    total_xp: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const [profileRes, gamificationRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('total_problems_solved, best_streak, current_streak, total_score')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_gamification')
          .select('level, total_xp')
          .eq('user_id', user.id)
          .single()
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      if (gamificationRes.data) {
        setGamification(gamificationRes.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="opacity-0 animate-fade-in"
            style={{ animationFillMode: 'forwards' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>

          {/* Streak Calendar */}
          <div className="animate-slide-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <StreakCalendar />
          </div>

          {/* Achievements System - Full View */}
          <div className="animate-slide-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <AchievementsSystem
              stats={{
                totalProblems: profile?.total_problems_solved || 0,
                currentStreak: profile?.current_streak || 0,
                bestStreak: profile?.best_streak || 0,
                totalScore: profile?.total_score || 0,
                level: gamification?.level || 1,
                totalXp: gamification?.total_xp || 0,
              }}
              showAll
            />
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Achievements;
