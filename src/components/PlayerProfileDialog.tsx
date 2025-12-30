import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Trophy, Target, Flame, TrendingUp, User, Calendar, Award } from 'lucide-react';
import { Badge } from './ui/badge';

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

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  description: string | null;
  earned_at: string;
}

interface PlayerProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BADGE_DEFINITIONS: Record<string, { icon: string; name: string; color: string }> = {
  daily_winner: { icon: "🥇", name: "Kunlik g'olib", color: "from-yellow-500 to-amber-500" },
  weekly_winner: { icon: "🏆", name: "Haftalik chempion", color: "from-purple-500 to-pink-500" },
  weekly_gold: { icon: "🥇", name: "Haftalik oltin", color: "from-yellow-400 to-amber-600" },
  weekly_silver: { icon: "🥈", name: "Haftalik kumush", color: "from-slate-300 to-slate-500" },
  weekly_bronze: { icon: "🥉", name: "Haftalik bronza", color: "from-orange-400 to-amber-700" },
  streak_3: { icon: "🔥", name: "Uch kunlik seriya", color: "from-orange-400 to-red-400" },
  streak_5: { icon: "🔥", name: "Besh kunlik seriya", color: "from-orange-500 to-red-500" },
  streak_7: { icon: "🔥", name: "Haftalik seriya", color: "from-orange-500 to-red-500" },
  streak_14: { icon: "⚡", name: "Ikki haftalik seriya", color: "from-yellow-500 to-orange-500" },
  streak_30: { icon: "⭐", name: "Oylik seriya", color: "from-amber-500 to-yellow-500" },
  best_streak_10: { icon: "⚡", name: "Seriya ustasi", color: "from-blue-500 to-cyan-500" },
  best_streak_25: { icon: "💎", name: "Super seriya", color: "from-indigo-500 to-purple-500" },
  solver_100: { icon: "💯", name: "100 masala", color: "from-green-500 to-emerald-500" },
  solver_500: { icon: "🎯", name: "500 masala", color: "from-teal-500 to-green-500" },
  solver_1000: { icon: "🏆", name: "Ming masala", color: "from-yellow-500 to-orange-500" },
  score_1000: { icon: "🌟", name: "Ming ball", color: "from-blue-500 to-indigo-500" },
  score_5000: { icon: "👑", name: "Besh ming ball", color: "from-amber-500 to-orange-500" },
  daily_score_500: { icon: "⭐", name: "Kunlik besh yuz ball", color: "from-blue-400 to-indigo-400" },
  daily_score_1000: { icon: "🔥", name: "Kunlik ming ball", color: "from-orange-500 to-red-600" },
  accuracy_95: { icon: "🎯", name: "Super aniqlik", color: "from-green-500 to-teal-500" },
  perfect_game: { icon: "💎", name: "Mukammal o'yin", color: "from-purple-500 to-pink-500" },
  first_game: { icon: "🎮", name: "Birinchi qadam", color: "from-pink-500 to-rose-500" },
  games_10: { icon: "🎲", name: "Faol o'yinchi", color: "from-violet-500 to-purple-500" },
  games_50: { icon: "🎖️", name: "Tajribali", color: "from-slate-500 to-zinc-500" },
};

export const PlayerProfileDialog = ({ userId, open, onOpenChange }: PlayerProfileDialogProps) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats>({ totalGames: 0, avgAccuracy: 0, recentGames: 0 });
  const [badges, setBadges] = useState<UserBadge[]>([]);
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

      // Fetch user badges
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (badgesData) {
        setBadges(badgesData);
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

  // Get unique badge types
  const uniqueBadgeTypes = [...new Set(badges.map((b) => b.badge_type))];
  const badgeCounts = badges.reduce((acc, badge) => {
    acc[badge.badge_type] = (acc[badge.badge_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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

            {/* Badges Section */}
            {badges.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <h4 className="font-semibold">Mukofotlar</h4>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {badges.length} ta
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {uniqueBadgeTypes.slice(0, 10).map((type) => {
                    const definition = BADGE_DEFINITIONS[type];
                    const count = badgeCounts[type] || 0;
                    const badge = badges.find((b) => b.badge_type === type);

                    return (
                      <div
                        key={type}
                        className="relative group cursor-pointer"
                        title={definition?.name || badge?.badge_name}
                      >
                        <div
                          className={`aspect-square rounded-lg bg-gradient-to-br ${
                            definition?.color || "from-gray-500 to-gray-600"
                          } p-0.5 shadow-md hover:scale-110 transition-transform`}
                        >
                          <div className="w-full h-full rounded-[6px] bg-card flex flex-col items-center justify-center">
                            <span className="text-xl">
                              {definition?.icon || badge?.badge_icon || "🏆"}
                            </span>
                            {count > 1 && (
                              <span className="text-[8px] font-bold text-muted-foreground">
                                x{count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {uniqueBadgeTypes.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{uniqueBadgeTypes.length - 10} ta boshqa mukofot
                  </p>
                )}
              </div>
            )}

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
