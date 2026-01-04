import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RankingUser {
  id: string;
  username: string;
  avatar_url: string | null;
  total_score: number;
  rank: number;
}

interface WeeklyRankingPreviewProps {
  onViewAll?: () => void;
}

export const WeeklyRankingPreview = ({ onViewAll }: WeeklyRankingPreviewProps) => {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<RankingUser[]>([]);
  const [userRank, setUserRank] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // Get top 3 users
        const { data: topData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, total_score, user_id')
          .order('total_score', { ascending: false })
          .limit(3);

        if (topData) {
          setTopUsers(topData.map((u, i) => ({
            id: u.user_id,
            username: u.username,
            avatar_url: u.avatar_url,
            total_score: u.total_score || 0,
            rank: i + 1
          })));
        }

        // Get current user's rank
        if (user) {
          const { data: allUsers } = await supabase
            .from('profiles')
            .select('user_id, username, avatar_url, total_score')
            .order('total_score', { ascending: false });

          if (allUsers) {
            const userIndex = allUsers.findIndex(u => u.user_id === user.id);
            if (userIndex !== -1) {
              setUserRank({
                id: user.id,
                username: allUsers[userIndex].username,
                avatar_url: allUsers[userIndex].avatar_url,
                total_score: allUsers[userIndex].total_score || 0,
                rank: userIndex + 1
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400/20 to-amber-500/10 border-amber-400/30';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30';
      default:
        return 'bg-muted/50 border-border/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl blur-xl" />

      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Haftalik reyting</h3>
              <p className="text-xs text-muted-foreground">Top 10 o'yinchilar</p>
            </div>
          </div>
          <button 
            onClick={onViewAll}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            Hammasi <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Top 3 */}
        <div className="p-3 space-y-2">
          {topUsers.map((rankUser, index) => (
            <div 
              key={rankUser.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
                getRankBg(rankUser.rank)
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(rankUser.rank)}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {rankUser.avatar_url ? (
                  <img 
                    src={rankUser.avatar_url} 
                    alt={rankUser.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              {/* Name & Score */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block text-foreground">
                  {rankUser.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {rankUser.total_score.toLocaleString()} ball
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Current user's rank if not in top 3 */}
        {userRank && userRank.rank > 3 && (
          <>
            <div className="px-4 py-2">
              <div className="text-center text-xs text-muted-foreground">• • •</div>
            </div>
            <div className="p-3 pt-0">
              <div 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  "bg-primary/10 border-primary/30"
                )}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(userRank.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ring-2 ring-primary">
                  {userRank.avatar_url ? (
                    <img 
                      src={userRank.avatar_url} 
                      alt={userRank.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Name & Score */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm truncate block text-primary">
                    {userRank.username} (Siz)
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {userRank.total_score.toLocaleString()} ball
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
