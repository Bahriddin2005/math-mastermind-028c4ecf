import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Trophy, Coins, Medal, Crown, Star, 
  TrendingUp, Calendar, CalendarDays
} from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_coins: number;
  total_score: number;
  games_played: number;
  rank: number;
}

interface GameLeaderboardProps {
  compact?: boolean;
}

export const GameLeaderboard = ({ compact = false }: GameLeaderboardProps) => {
  const { user } = useAuth();
  const [dailyLeaders, setDailyLeaders] = useState<LeaderboardEntry[]>([]);
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<{ daily: number; weekly: number; allTime: number }>({
    daily: 0, weekly: 0, allTime: 0
  });

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Load all user progress with profiles
      const { data: progressData } = await supabase
        .from('user_level_progress')
        .select(`
          user_id,
          best_score,
          stars_earned,
          completed_at,
          created_at
        `);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, total_score');

      const { data: currencyData } = await supabase
        .from('user_game_currency')
        .select('user_id, coins');

      if (!progressData || !profilesData) {
        setLoading(false);
        return;
      }

      // Create maps for quick lookup
      const profileMap = new Map(profilesData.map(p => [p.user_id, p]));
      const currencyMap = new Map(currencyData?.map(c => [c.user_id, c.coins]) || []);

      // Calculate scores by user and period
      const userScores = new Map<string, { 
        daily: number; weekly: number; allTime: number; games: number 
      }>();

      progressData.forEach(progress => {
        const existing = userScores.get(progress.user_id) || { daily: 0, weekly: 0, allTime: 0, games: 0 };
        const createdDate = progress.created_at?.split('T')[0] || '';
        
        existing.allTime += progress.best_score || 0;
        existing.games += 1;
        
        if (createdDate === today) {
          existing.daily += progress.best_score || 0;
        }
        if (createdDate >= weekAgo) {
          existing.weekly += progress.best_score || 0;
        }
        
        userScores.set(progress.user_id, existing);
      });

      // Create leaderboard entries
      const createLeaderboard = (period: 'daily' | 'weekly' | 'allTime'): LeaderboardEntry[] => {
        const entries: LeaderboardEntry[] = [];
        
        userScores.forEach((scores, userId) => {
          const profile = profileMap.get(userId);
          if (profile && scores[period] > 0) {
            entries.push({
              user_id: userId,
              username: profile.username,
              avatar_url: profile.avatar_url,
              total_coins: currencyMap.get(userId) || 0,
              total_score: scores[period],
              games_played: scores.games,
              rank: 0
            });
          }
        });

        // Sort and assign ranks
        entries.sort((a, b) => b.total_score - a.total_score);
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        return entries.slice(0, compact ? 5 : 20);
      };

      const daily = createLeaderboard('daily');
      const weekly = createLeaderboard('weekly');
      const allTime = createLeaderboard('allTime');

      setDailyLeaders(daily);
      setWeeklyLeaders(weekly);
      setAllTimeLeaders(allTime);

      // Find user rank
      if (user) {
        setUserRank({
          daily: daily.findIndex(e => e.user_id === user.id) + 1 || 0,
          weekly: weekly.findIndex(e => e.user_id === user.id) + 1 || 0,
          allTime: allTime.findIndex(e => e.user_id === user.id) + 1 || 0
        });
      }

    } catch (error) {
      console.error('Error loading leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
    return '';
  };

  const LeaderboardList = ({ entries, period }: { entries: LeaderboardEntry[]; period: string }) => (
    <div className="space-y-2">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Hozircha ma'lumot yo'q</p>
        </div>
      ) : (
        entries.map((entry) => {
          const isCurrentUser = user?.id === entry.user_id;
          return (
            <div 
              key={entry.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                getRankBgColor(entry.rank)
              } ${isCurrentUser ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(entry.rank)}
              </div>
              
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {entry.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : ''}`}>
                    {entry.username}
                    {isCurrentUser && <span className="text-xs ml-1">(siz)</span>}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.games_played} o'yin
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 font-bold">
                  <Star className="h-4 w-4 text-primary" />
                  <span>{entry.total_score.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span>{entry.total_coins.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* User rank if not in top */}
      {user && !entries.some(e => e.user_id === user.id) && (
        <div className="border-t pt-3 mt-3">
          <p className="text-sm text-muted-foreground text-center">
            Sizning o'rningiz: #{
              period === 'daily' ? userRank.daily :
              period === 'weekly' ? userRank.weekly :
              userRank.allTime
            } yoki reytingda yo'qsiz
          </p>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Haftalik Liderlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardList entries={weeklyLeaders} period="weekly" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          O'yin Reytingi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 mr-1.5" />
              Bugun
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Hafta
            </TabsTrigger>
            <TabsTrigger value="alltime" className="text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Hammasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <LeaderboardList entries={dailyLeaders} period="daily" />
          </TabsContent>
          
          <TabsContent value="weekly">
            <LeaderboardList entries={weeklyLeaders} period="weekly" />
          </TabsContent>
          
          <TabsContent value="alltime">
            <LeaderboardList entries={allTimeLeaders} period="alltime" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
