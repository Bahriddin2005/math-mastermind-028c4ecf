import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Medal, Award, User, CalendarDays, CalendarRange, Sparkles, Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlayerProfileDialog } from './PlayerProfileDialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  best_streak: number;
  avatar_url: string | null;
  level?: number;
  total_xp?: number;
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
        // Get profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, total_score, best_streak, avatar_url')
          .order('total_score', { ascending: false })
          .limit(50);

        if (profilesData) {
          // Get gamification data for these users
          const userIds = profilesData.map(p => p.user_id);
          const { data: gamificationData } = await supabase
            .from('user_gamification')
            .select('user_id, level, total_xp')
            .in('user_id', userIds);

          const gamificationMap = new Map(
            gamificationData?.map(g => [g.user_id, { level: g.level, total_xp: g.total_xp }]) || []
          );

          setEntries(profilesData.map(p => ({
            ...p,
            level: gamificationMap.get(p.user_id)?.level || 1,
            total_xp: gamificationMap.get(p.user_id)?.total_xp || 0,
          })));
        }
      } else {
        const now = new Date();
        let startDate: Date;
        
        if (timeFilter === 'weekly') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        }

        const { data: sessionsData } = await supabase
          .from('game_sessions')
          .select('user_id, score, best_streak')
          .gte('created_at', startDate.toISOString());

        if (sessionsData) {
          const userScores = new Map<string, { totalScore: number; bestStreak: number }>();
          
          sessionsData.forEach(session => {
            const existing = userScores.get(session.user_id) || { totalScore: 0, bestStreak: 0 };
            userScores.set(session.user_id, {
              totalScore: existing.totalScore + (session.score || 0),
              bestStreak: Math.max(existing.bestStreak, session.best_streak || 0),
            });
          });

          const userIds = Array.from(userScores.keys());
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, user_id, username, avatar_url')
              .in('user_id', userIds);

            // Get gamification data
            const { data: gamificationData } = await supabase
              .from('user_gamification')
              .select('user_id, level, total_xp')
              .in('user_id', userIds);

            const gamificationMap = new Map(
              gamificationData?.map(g => [g.user_id, { level: g.level, total_xp: g.total_xp }]) || []
            );

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
                  level: gamificationMap.get(profile.user_id)?.level || 1,
                  total_xp: gamificationMap.get(profile.user_id)?.total_xp || 0,
                };
              });

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
        return (
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600 flex items-center justify-center shadow-lg dark:shadow-yellow-500/30">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-400 dark:to-gray-500 flex items-center justify-center shadow-md dark:shadow-gray-500/30">
            <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        );
      case 3:
        return (
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 dark:from-amber-600 dark:to-amber-800 flex items-center justify-center shadow-md dark:shadow-amber-600/30">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-secondary dark:bg-secondary/60 flex items-center justify-center border border-border/30 dark:border-border/20">
            <span className="text-sm sm:text-lg font-display font-bold text-muted-foreground">{rank}</span>
          </div>
        );
    }
  };

  const getRankStyles = (rank: number, isCurrentUser: boolean) => {
    const baseStyles = 'border transition-all duration-300 cursor-pointer hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/20';
    
    if (isCurrentUser) {
      return cn(baseStyles, 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/40');
    }
    
    switch (rank) {
      case 1:
        return cn(baseStyles, 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent dark:from-yellow-500/15 dark:via-amber-500/10 dark:to-transparent border-yellow-500/30 dark:border-yellow-500/40 hover:border-yellow-500/50');
      case 2:
        return cn(baseStyles, 'bg-gradient-to-r from-gray-400/10 via-gray-400/5 to-transparent dark:from-gray-400/15 dark:via-gray-400/10 dark:to-transparent border-gray-400/30 dark:border-gray-400/40 hover:border-gray-400/50');
      case 3:
        return cn(baseStyles, 'bg-gradient-to-r from-amber-600/10 via-amber-600/5 to-transparent dark:from-amber-600/15 dark:via-amber-600/10 dark:to-transparent border-amber-600/30 dark:border-amber-600/40 hover:border-amber-600/50');
      default:
        return cn(baseStyles, 'bg-card dark:bg-card/80 hover:bg-secondary/50 dark:hover:bg-secondary/30 border-border/40 dark:border-border/30');
    }
  };

  if (loading) {
    return (
      <Card className="border-border/40 dark:border-border/20 shadow-md dark:shadow-lg dark:shadow-black/20">
        <CardContent className="py-12 sm:py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm sm:text-base">Reyting yuklanmoqda...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/40 dark:border-border/20 shadow-md dark:shadow-lg dark:shadow-black/20 overflow-hidden bg-card dark:bg-card/95">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 bg-gradient-to-r from-warning/5 via-accent/5 to-transparent dark:from-warning/10 dark:via-accent/10 dark:to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 dark:from-primary dark:to-primary/70 flex items-center justify-center shadow-sm dark:shadow-primary/30">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-base sm:text-lg">Eng yaxshi o'yinchilar</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/70 font-normal mt-0.5">
                  {entries.length} ta o'yinchi
                </p>
              </div>
            </CardTitle>
          </div>
          
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mt-3 sm:mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/60 dark:bg-secondary/40 p-0.5 sm:p-1 h-9 sm:h-10 border border-border/20 dark:border-border/30">
              <TabsTrigger value="all" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-card/90 data-[state=active]:shadow-sm px-1 sm:px-2">
                <Trophy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Hammasi</span>
                <span className="xs:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-card/90 data-[state=active]:shadow-sm px-1 sm:px-2">
                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Haftalik</span>
                <span className="xs:hidden">Hafta</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs data-[state=active]:bg-card dark:data-[state=active]:bg-card/90 data-[state=active]:shadow-sm px-1 sm:px-2">
                <CalendarRange className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Oylik</span>
                <span className="xs:hidden">Oy</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="pt-3 sm:pt-4 px-2 sm:px-6">
          {entries.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-secondary dark:bg-secondary/40 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-border/20 dark:border-border/30">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg mb-2">Hali o'yinchilar yo'q</h3>
              <p className="text-muted-foreground dark:text-muted-foreground/70 text-xs sm:text-sm">Birinchi bo'lib reytingga kiring!</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === currentUserId;
                
                return (
                  <div
                    key={entry.id}
                    onClick={() => handlePlayerClick(entry.user_id)}
                    className={cn(
                      'flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl sm:rounded-2xl h-[72px] sm:h-[88px]',
                      getRankStyles(rank, isCurrentUser)
                    )}
                  >
                    {/* Rank */}
                    {getRankIcon(rank)}
                    
                    {/* Avatar - Enhanced dark mode */}
                    <Avatar className="h-9 w-9 sm:h-12 sm:w-12 border-2 border-border dark:border-border/50 shadow-sm dark:shadow-md flex-shrink-0">
                      <AvatarImage src={entry.avatar_url || undefined} alt={entry.username} />
                      <AvatarFallback className="bg-primary/10 dark:bg-primary/20 font-semibold text-xs sm:text-base">
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <p className={cn(
                          'font-display font-bold text-sm sm:text-base truncate',
                          isCurrentUser && 'text-primary'
                        )}>
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 dark:bg-secondary/60">siz</Badge>
                        )}
                        {rank <= 3 && (
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-warning hidden sm:block" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/70 flex items-center gap-1">
                          <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent" />
                          {entry.best_streak}
                        </span>
                        <span className="text-[10px] sm:text-xs text-primary flex items-center gap-1 font-medium">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-primary" />
                          Lv.{entry.level || 1}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/70">
                          {(entry.total_xp || 0).toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                    
                    {/* Score - Enhanced */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg sm:text-2xl font-display font-bold text-primary">
                        {entry.total_score.toLocaleString()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/70">ball</p>
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