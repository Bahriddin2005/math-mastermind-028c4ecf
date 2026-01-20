import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useSound } from '@/hooks/useSound';
import { supabase } from '@/integrations/supabase/client';
import { PandaMascot } from '@/components/PandaMascot';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { SectionCarousel, kidsSection, parentsSection, teachersSection, personalSection, blogSection } from '@/components/SectionCarousel';
import { SubscriptionPlans } from '@/components/SubscriptionPlans';

interface Profile {
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  daily_goal: number;
  current_streak: number;
  avatar_url: string | null;
}

const KidsHome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todaySolved, setTodaySolved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');
  const [mascotMessage, setMascotMessage] = useState<string | undefined>();

  // Get mascot message based on progress
  const getMascotMessage = (solved: number, goal: number) => {
    const progress = (solved / goal) * 100;
    if (progress >= 100) return "Ajoyib! Maqsadga erishdingiz! 🎉";
    if (progress >= 75) return "Zo'r! Ozgina qoldi!";
    if (progress >= 50) return "Yaxshi! Davom eting!";
    if (progress >= 25) return "Rahmat! Harakat qiling!";
    return "Bugun nima o'ynaymiz?";
  };

  useEffect(() => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }

    if (!user) return;

    const fetchData = async () => {
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

      // Get today's solved problems
      const today = new Date().toISOString().split('T')[0];
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('correct')
        .eq('user_id', user.id)
        .gte('created_at', today);

      const solved = sessionsData?.reduce((sum, s) => sum + (s.correct || 0), 0) || 0;
      setTodaySolved(solved);

      // Update mascot based on progress
      const goal = profileData?.daily_goal || 20;
      const progress = (solved / goal) * 100;
      
      if (progress >= 100) {
        setMascotMood('celebrating');
        triggerConfetti('stars');
      } else if (progress >= 50) {
        setMascotMood('excited');
      } else {
        setMascotMood('happy');
      }
      
      setMascotMessage(getMascotMessage(solved, goal));
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          {/* IqroMax Logo - Clean & Elegant */}
          <div className="relative animate-fade-in">
            {/* Subtle glow behind logo */}
            <div className="absolute inset-0 blur-3xl opacity-20 bg-primary rounded-full scale-150" />
            
            {/* Main logo */}
            <img 
              src="/favicon.jpg" 
              alt="IqroMax" 
              className="relative w-32 h-32 sm:w-40 sm:h-40 object-contain rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300"
            />
            
            {/* Floating sparkles */}
            <div className="absolute -top-3 -right-3 text-3xl animate-bounce-soft">✨</div>
            <div className="absolute -bottom-2 -left-2 text-2xl animate-bounce-soft" style={{ animationDelay: '0.5s' }}>⭐</div>
          </div>
          
          {/* Loading text */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-lg">Yuklanmoqda...</p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-20 sm:pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      {/* Hero Carousel */}
      <div className="container px-3 xs:px-4 py-4 sm:py-6">
        <HeroCarousel />
      </div>

      {/* Main Action Button - Touch optimized */}
      <div className="container px-3 xs:px-4">
        <button
          onClick={() => navigate('/train')}
          className="w-full h-16 xs:h-18 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-xl hover:shadow-green-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group touch-target"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
          <span className="text-3xl sm:text-4xl">🎮</span>
          <span className="text-lg sm:text-xl font-bold text-white">O'ynab o'rgan</span>
          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white ml-1 sm:ml-2" />
        </button>
      </div>

      {/* Section Carousels */}
      <div className="container px-3 xs:px-4">
        <SectionCarousel {...kidsSection} />
        <SectionCarousel {...parentsSection} />
        <SectionCarousel {...teachersSection} />
        <SectionCarousel {...personalSection} />
        <SectionCarousel {...blogSection} />
      </div>

      {/* Subscription Plans */}
      <div className="container px-3 xs:px-4">
        <SubscriptionPlans />
      </div>

      {/* Not logged in CTA with Panda */}
      {!user && (
        <div className="container px-3 xs:px-4 py-6 sm:py-8">
          <div className="bg-gradient-to-r from-primary via-accent to-primary rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-center text-white shadow-2xl">
            <div className="flex justify-center mb-3 sm:mb-4">
              <PandaMascot mood="excited" size="md" showMessage={false} />
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-display font-black mb-2 sm:mb-3">
              O'yin boshlash uchun ro'yxatdan o'ting!
            </h2>
            <p className="text-white/80 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
              Yutuqlaringizni saqlang, do'stlar bilan poygalashing va sovg'alar yutib oling! 🎁
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-white/90 font-bold text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl sm:rounded-2xl shadow-lg hover:scale-105 transition-transform touch-target"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Boshlash!
            </Button>
          </div>
        </div>
      )}
    </PageBackground>
  );
};

export default KidsHome;
