import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Medal, Award, User, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlayerProfileDialog } from './PlayerProfileDialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  best_streak: number;
  avatar_url: string | null;
}

interface LeaderboardProps {
  currentUserId?: string;
}

type TimeFilter = 'all' | 'weekly' | 'monthly';

export const Leaderboard = ({ currentUserId }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      if (timeFilter === 'all') {
        // Fetch from profiles for all-time leaderboard
        const { data } = await supabase
          .from('profiles')
          .select('id, user_id, username, total_score, best_streak, avatar_url')
          .order('total_score', { ascending: false })
          .limit(50);

        if (data) {
          setEntries(data);
        }
      } else {
        // Fetch from game_sessions for time-filtered leaderboard
        const now = new Date();
        let startDate: Date;
        
        if (timeFilter === 'weekly') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        }

        // First get aggregated scores from game_sessions
        const { data: sessionsData } = await supabase
          .from('game_sessions')
          .select('user_id, score, best_streak')
          .gte('created_at', startDate.toISOString());

        if (sessionsData) {
          // Aggregate scores by user
          const userScores = new Map<string, { totalScore: number; bestStreak: number }>();
          
          sessionsData.forEach(session => {
            const existing = userScores.get(session.user_id) || { totalScore: 0, bestStreak: 0 };
            userScores.set(session.user_id, {
              totalScore: existing.totalScore + (session.score || 0),
              bestStreak: Math.max(existing.bestStreak, session.best_streak || 0),
            });
          });

          // Get user profiles for these users
          const userIds = Array.from(userScores.keys());
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, user_id, username, avatar_url')
              .in('user_id', userIds);

            if (profilesData) {
              const leaderboardEntries: LeaderboardEntry[] = profilesData.map(profile => {
                const scores = userScores.get(profile.user_id) || { totalScore: 0, bestStreak: 0 };
                return {
                  id: profile.id,
                  user_id: profile.user_id,
                  username: profile.username,
                  total_score: scores.totalScore,
                  best_streak: scores.bestStreak,
                  avatar_url: profile.avatar_url,
                };
              });

              // Sort by total_score descending
              leaderboardEntries.sort((a, b) => b.total_score - a.total_score);
              setEntries(leaderboardEntries.slice(0, 50));
            }
          } else {
            setEntries([]);
          }
        }
      }

      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter]);

  const handlePlayerClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground w-6 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
      default:
        return 'bg-secondary/50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Eng yaxshi o'yinchilar
          </CardTitle>
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mt-3">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
                <Trophy className="h-3.5 w-3.5" />
                Hammasi
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                Haftalik
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-1.5 text-xs">
                <CalendarRange className="h-3.5 w-3.5" />
                Oylik
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Hali o'yinchilar yo'q</p>
          </div>
        ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === currentUserId;
                
                return (
                  <div
                    key={entry.id}
                    onClick={() => handlePlayerClick(entry.user_id)}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] hover:shadow-md',
                      getRankBg(rank),
                      isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(rank)}
                      </div>
                      <Avatar className="h-10 w-10 border-2 border-border">
                        <AvatarImage src={entry.avatar_url || undefined} alt={entry.username} />
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn(
                          'font-semibold',
                          isCurrentUser && 'text-primary'
                        )}>
                          {entry.username}
                          {isCurrentUser && ' (siz)'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Eng uzun seriya: {entry.best_streak}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-display font-bold text-primary">
                        {entry.total_score.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">ball</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PlayerProfileDialog
        userId={selectedUserId}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
};
