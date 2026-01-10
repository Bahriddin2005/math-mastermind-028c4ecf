import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Mascot } from '@/components/Mascot';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { StarBadge } from '@/components/kids/StarBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PlayerProfileDialog } from '@/components/PlayerProfileDialog';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  Crown,
  Flame,
  Star,
  Zap,
  CalendarDays,
  CalendarRange,
  Sparkles,
} from 'lucide-react';

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

type TimeFilter = 'all' | 'weekly' | 'monthly';

const KidsLeaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    if (timeFilter === 'all') {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, username, total_score, best_streak, avatar_url')
        .order('total_score', { ascending: false })
        .limit(50);

      if (profilesData) {
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
        
        // Trigger confetti if user is in top 3
        const userRank = profilesData.findIndex(p => p.user_id === user?.id);
        if (userRank >= 0 && userRank < 3) {
          triggerConfetti('stars');
        }
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

  const handlePlayerClick = (userId: string) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  };

  // Get top 3 players for podium
  const topThree = entries.slice(0, 3);
  const restPlayers = entries.slice(3);

  if (loading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Mascot mood="thinking" size="lg" animate />
          <p className="text-lg font-bold text-kids-purple animate-pulse">Reyting yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
          <Badge className="bg-gradient-to-r from-kids-yellow to-kids-orange text-white border-0 px-4 py-1.5">
            <Trophy className="h-4 w-4 mr-1.5" />
            Reyting
          </Badge>
        </div>

        {/* Time Filter */}
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-kids-purple/10 p-1 h-12 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Hammasi</span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Haftalik</span>
            </TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md gap-2">
              <CalendarRange className="h-4 w-4" />
              <span className="hidden sm:inline">Oylik</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {entries.length === 0 ? (
          <div className="text-center py-16">
            <Mascot mood="thinking" size="lg" message="Hali o'yinchilar yo'q. Birinchi bo'ling!" />
          </div>
        ) : (
          <>
            {/* Podium Section */}
            <div className="relative mb-8">
              {/* Decorations */}
              <div className="absolute top-0 left-1/4 text-4xl animate-bounce-soft">🎉</div>
              <div className="absolute top-4 right-1/4 text-3xl animate-bounce-soft" style={{ animationDelay: '0.3s' }}>✨</div>
              
              <div className="flex items-end justify-center gap-2 sm:gap-4 mb-4 pt-8">
                {/* 2nd Place */}
                {topThree[1] && (
                  <div 
                    className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handlePlayerClick(topThree[1].user_id)}
                  >
                    <div className="relative mb-2">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
                          <Medal className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-gray-300 shadow-xl">
                        <AvatarImage src={topThree[1].avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-xl font-bold">
                          {topThree[1].username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {topThree[1].user_id === user?.id && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-kids-purple text-white text-xs flex items-center justify-center font-bold">
                          Siz
                        </div>
                      )}
                    </div>
                    <div className="w-20 sm:w-28 h-24 sm:h-28 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-lg">
                      <span className="text-2xl font-black text-white">2</span>
                      <p className="text-xs font-bold text-white/90 truncate max-w-[72px] sm:max-w-[100px] mt-1">{topThree[1].username}</p>
                      <p className="text-lg font-bold text-white">{topThree[1].total_score.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div 
                    className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform -mt-8"
                    onClick={() => handlePlayerClick(topThree[0].user_id)}
                  >
                    <div className="relative mb-2">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kids-yellow to-kids-orange flex items-center justify-center shadow-lg animate-pulse">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="p-1 rounded-full bg-gradient-to-br from-kids-yellow to-kids-orange shadow-2xl">
                        <Avatar className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-kids-yellow shadow-xl">
                          <AvatarImage src={topThree[0].avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-kids-yellow to-kids-orange text-2xl font-bold text-white">
                            {topThree[0].username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {topThree[0].user_id === user?.id && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-kids-purple text-white text-xs flex items-center justify-center font-bold">
                          Siz
                        </div>
                      )}
                      {/* Sparkle effects */}
                      <div className="absolute -top-2 -left-2 text-xl animate-ping">✨</div>
                      <div className="absolute -top-2 -right-2 text-xl animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
                    </div>
                    <div className="w-24 sm:w-36 h-32 sm:h-36 bg-gradient-to-t from-kids-orange to-kids-yellow rounded-t-2xl flex flex-col items-center justify-start pt-3 shadow-xl">
                      <span className="text-3xl font-black text-white">1</span>
                      <p className="text-sm font-bold text-white/90 truncate max-w-[88px] sm:max-w-[128px] mt-1">{topThree[0].username}</p>
                      <p className="text-xl font-bold text-white">{topThree[0].total_score.toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Flame className="h-4 w-4 text-white/80" />
                        <span className="text-xs text-white/80">{topThree[0].best_streak}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div 
                    className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handlePlayerClick(topThree[2].user_id)}
                  >
                    <div className="relative mb-2">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <Avatar className="h-14 w-14 sm:h-18 sm:w-18 border-4 border-amber-600 shadow-xl">
                        <AvatarImage src={topThree[2].avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-lg font-bold text-white">
                          {topThree[2].username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {topThree[2].user_id === user?.id && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-kids-purple text-white text-[10px] flex items-center justify-center font-bold">
                          Siz
                        </div>
                      )}
                    </div>
                    <div className="w-18 sm:w-24 h-20 sm:h-24 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-2xl flex flex-col items-center justify-start pt-2 shadow-lg">
                      <span className="text-xl font-black text-white">3</span>
                      <p className="text-xs font-bold text-white/90 truncate max-w-[64px] sm:max-w-[88px]">{topThree[2].username}</p>
                      <p className="text-base font-bold text-white">{topThree[2].total_score.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of players */}
            {restPlayers.length > 0 && (
              <Card className="border-2 border-kids-purple/20 overflow-hidden">
                <CardHeader className="pb-2 bg-gradient-to-r from-kids-purple/5 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-kids-purple" />
                    Boshqa o'yinchilar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {restPlayers.map((entry, index) => {
                      const rank = index + 4;
                      const isCurrentUser = entry.user_id === user?.id;
                      
                      return (
                        <div
                          key={entry.id}
                          onClick={() => handlePlayerClick(entry.user_id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-kids-purple/20 to-kids-pink/20 ring-2 ring-kids-purple' 
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          {/* Rank */}
                          <div className="w-10 h-10 rounded-xl bg-kids-purple/10 flex items-center justify-center font-bold text-kids-purple">
                            {rank}
                          </div>
                          
                          {/* Avatar */}
                          <Avatar className="h-12 w-12 border-2 border-kids-purple/20">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-kids-purple/20 to-kids-pink/20 font-bold">
                              {entry.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`font-bold truncate ${isCurrentUser ? 'text-kids-purple' : ''}`}>
                                {entry.username}
                              </p>
                              {isCurrentUser && (
                                <Badge className="bg-kids-purple text-white border-0 text-xs px-1.5 py-0">siz</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-kids-purple fill-kids-purple" />
                                Lv.{entry.level || 1}
                              </span>
                              <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3 text-kids-orange" />
                                {entry.best_streak}
                              </span>
                            </div>
                          </div>
                          
                          {/* Score */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-kids-purple">{entry.total_score.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">ball</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <PlayerProfileDialog
        userId={selectedUserId}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </PageBackground>
  );
};

export default KidsLeaderboard;
