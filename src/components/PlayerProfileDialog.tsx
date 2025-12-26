import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Trophy, Target, Flame, TrendingUp, User, Calendar } from 'lucide-react';

interface PlayerProfile {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  total_problems_solved: number;
  best_streak: number;
  avatar_url: string | null;
  created_at: string;
}

interface PlayerStats {
  totalGames: number;
  avgAccuracy: number;
  recentGames: number;
}

interface PlayerProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlayerProfileDialog = ({ userId, open, onOpenChange }: PlayerProfileDialogProps) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats>({ totalGames: 0, avgAccuracy: 0, recentGames: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !open) return;

    const fetchPlayerData = async () => {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch game sessions for stats
      const { data: sessionsData } = await supabase
        .from('game_sessions')
        .select('correct, incorrect, created_at')
        .eq('user_id', userId);

      if (sessionsData) {
        const totalGames = sessionsData.length;
        const totalCorrect = sessionsData.reduce((sum, s) => sum + (s.correct || 0), 0);
        const totalProblems = sessionsData.reduce((sum, s) => sum + (s.correct || 0) + (s.incorrect || 0), 0);
        const avgAccuracy = totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0;
        
        // Recent games (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentGames = sessionsData.filter(s => new Date(s.created_at) >= weekAgo).length;

        setStats({ totalGames, avgAccuracy, recentGames });
      }

      setLoading(false);
    };

    fetchPlayerData();
  }, [userId, open]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">O'yinchi profili</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  <User className="h-10 w-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold">{profile.username}</h3>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(profile.created_at)} dan beri
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <Trophy className="h-6 w-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{profile.total_score.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Jami ball</p>
              </div>
              <div className="bg-accent/10 rounded-xl p-4 text-center">
                <Target className="h-6 w-6 text-accent-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold">{profile.total_problems_solved}</p>
                <p className="text-xs text-muted-foreground">Yechilgan</p>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 text-center">
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-500">{profile.best_streak}</p>
                <p className="text-xs text-muted-foreground">Eng uzun seriya</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-500">{stats.avgAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Aniqlik</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jami o'yinlar</span>
                <span className="font-semibold">{stats.totalGames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">So'nggi 7 kun</span>
                <span className="font-semibold">{stats.recentGames} o'yin</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            O'yinchi topilmadi
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
