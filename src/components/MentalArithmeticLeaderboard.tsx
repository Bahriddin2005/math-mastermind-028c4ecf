import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trophy, Medal, Award, CalendarDays, CalendarRange, Sparkles, Flame, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlayerProfileDialog } from './PlayerProfileDialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  total_score: number;
  best_streak: number;
  correct_count: number;
  accuracy: number;
  avatar_url: string | null;
}

type TimeFilter = 'all' | 'weekly' | 'daily';

export const MentalArithmeticLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);

      const now = new Date();
      let startDate: Date | null = null;
      
      if (timeFilter === 'daily') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      }

      // Fetch mental-arithmetic sessions
      let query = supabase
        .from('game_sessions')
        .select('user_id, score, best_streak, correct, incorrect')
        .eq('section', 'mental-arithmetic');

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: sessionsData } = await query;

      if (sessionsData && sessionsData.length > 0) {
        const userScores = new Map<string, { 
          totalScore: number; 
          bestStreak: number; 
          correct: number;
          incorrect: number;
        }>();
        
        sessionsData.forEach(session => {
          const existing = userScores.get(session.user_id) || { 
            totalScore: 0, 
            bestStreak: 0,
            correct: 0,
            incorrect: 0,
          };
          userScores.set(session.user_id, {
            totalScore: existing.totalScore + (session.score || 0),
            bestStreak: Math.max(existing.bestStreak, session.best_streak || 0),
            correct: existing.correct + (session.correct || 0),
            incorrect: existing.incorrect + (session.incorrect || 0),
          });
        });

        const userIds = Array.from(userScores.keys());
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, user_id, username, avatar_url')
            .in('user_id', userIds);

          if (profilesData) {
            const leaderboardEntries: LeaderboardEntry[] = profilesData.map(profile => {
              const scores = userScores.get(profile.user_id) || { 
                totalScore: 0, 
                bestStreak: 0,
                correct: 0,
                incorrect: 0,
              };
              const total = scores.correct + scores.incorrect;
              return {
                id: profile.id,
                user_id: profile.user_id,
                username: profile.username,
                total_score: scores.totalScore,
                best_streak: scores.bestStreak,
                correct_count: scores.correct,
                accuracy: total > 0 ? Math.round((scores.correct / total) * 100) : 0,
                avatar_url: profile.avatar_url,
              };
            });

            leaderboardEntries.sort((a, b) => b.total_score - a.total_score);
            setEntries(leaderboardEntries.slice(0, 50));
          }
        } else {
          setEntries([]);
        }
      } else {
        setEntries([]);
      }

      setLoading(false);
    };

    fetchLeaderboard();

    const channel = supabase
      .channel('mental-arithmetic-leaderboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_sessions',
          filter: 'section=eq.mental-arithmetic'
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
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md">
            <Medal className="h-5 w-5 text-white" />
          </div>
        );
      case 3:
        return (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md">
            <Award className="h-5 w-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
            <span className="text-lg font-display font-bold text-muted-foreground">{rank}</span>
          </div>
        );
    }
  };

  const getRankStyles = (rank: number, isCurrentUser: boolean) => {
    const baseStyles = 'border transition-all duration-300 cursor-pointer hover:shadow-lg';
    
    if (isCurrentUser) {
      return cn(baseStyles, 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 border-primary/30');
    }
    
    switch (rank) {
      case 1:
        return cn(baseStyles, 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/30 hover:border-yellow-500/50');
      case 2:
        return cn(baseStyles, 'bg-gradient-to-r from-gray-400/10 via-gray-400/5 to-transparent border-gray-400/30 hover:border-gray-400/50');
      case 3:
        return cn(baseStyles, 'bg-gradient-to-r from-amber-600/10 via-amber-600/5 to-transparent border-amber-600/30 hover:border-amber-600/50');
      default:
        return cn(baseStyles, 'bg-card hover:bg-secondary/50 border-border/40');
    }
  };

  // Find current user's rank
  const currentUserRank = user ? entries.findIndex(e => e.user_id === user.id) + 1 : 0;
  const currentUserEntry = user ? entries.find(e => e.user_id === user.id) : null;

  if (loading) {
    return (
      <Card className="border-border/40 shadow-md">
        <CardContent className="py-16 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Reyting yuklanmoqda...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/40 shadow-md overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Mental Arifmetika Reytingi</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  {entries.length} ta o'yinchi
                </p>
              </div>
            </CardTitle>
          </div>
          
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/60 p-1">
              <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-card">
                <Trophy className="h-3.5 w-3.5" />
                Hammasi
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-card">
                <CalendarRange className="h-3.5 w-3.5" />
                Haftalik
              </TabsTrigger>
              <TabsTrigger value="daily" className="flex items-center gap-1.5 text-xs data-[state=active]:bg-card">
                <CalendarDays className="h-3.5 w-3.5" />
                Bugun
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        {/* Current user's position */}
        {currentUserEntry && currentUserRank > 3 && (
          <div className="px-6 py-3 bg-primary/5 border-b border-border/40">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Sizning o'rningiz:</span>
              <Badge variant="secondary" className="font-bold">#{currentUserRank}</Badge>
              <span className="text-primary font-semibold">{currentUserEntry.total_score} ball</span>
              <span className="text-muted-foreground">• {currentUserEntry.accuracy}% aniqlik</span>
            </div>
          </div>
        )}
        
        <CardContent className="pt-4">
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <Calculator className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Hali o'yinchilar yo'q</h3>
              <p className="text-muted-foreground text-sm">Birinchi bo'lib reytingga kiring!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;
                
                return (
                  <div
                    key={entry.id}
                    onClick={() => handlePlayerClick(entry.user_id)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl',
                      getRankStyles(rank, isCurrentUser)
                    )}
                  >
                    {/* Rank */}
                    {getRankIcon(rank)}
                    
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-border shadow-sm">
                      <AvatarImage src={entry.avatar_url || undefined} alt={entry.username} />
                      <AvatarFallback className="bg-primary/10 font-semibold">
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-display font-bold truncate',
                          isCurrentUser && 'text-primary'
                        )}>
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">siz</Badge>
                        )}
                        {rank <= 3 && (
                          <Sparkles className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3 text-accent" />
                          {entry.best_streak} seriya
                        </span>
                        <span className="text-xs text-blue-500">
                          {entry.accuracy}% aniqlik
                        </span>
                        <span className="text-xs text-green-500">
                          {entry.correct_count} to'g'ri
                        </span>
                      </div>
                    </div>
                    
                    {/* Score */}
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

export default MentalArithmeticLeaderboard;
