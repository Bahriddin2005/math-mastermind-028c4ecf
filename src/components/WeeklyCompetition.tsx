import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Clock, Users, Play, Medal, Crown, Star, Flame, Zap, Target, TrendingUp, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours } from "date-fns";
import confetti from "canvas-confetti";

interface WeeklyChallenge {
  id: string;
  week_start: string;
  week_end: string;
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  seed: number;
}

interface WeeklyResult {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_score: number;
  games_played: number;
  correct_answers: number;
  best_time: number | null;
}

// Challenge types for variety
const CHALLENGE_TYPES = [
  { id: 'speed', name: 'Tezlik', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', description: 'Eng tez javob beruvchi g\'olib' },
  { id: 'accuracy', name: 'Aniqlik', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10', description: 'Eng ko\'p to\'g\'ri javob' },
  { id: 'streak', name: 'Streak', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10', description: 'Eng uzun to\'g\'ri javoblar ketma-ketligi' },
  { id: 'endurance', name: 'Chidamlilik', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10', description: 'Eng ko\'p o\'yin o\'ynagan' },
];

export const WeeklyCompetition = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [selectedTab, setSelectedTab] = useState('leaderboard');
  const [animatingRank, setAnimatingRank] = useState<number | null>(null);

  // Fetch user profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Get current week's challenge
  const { data: currentChallenge, isLoading: loadingChallenge } = useQuery({
    queryKey: ["current-weekly-challenge"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .lte("week_start", today)
        .gte("week_end", today)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as WeeklyChallenge | null;
    },
  });

  // Get weekly leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ["weekly-leaderboard", currentChallenge?.id],
    queryFn: async () => {
      if (!currentChallenge) return [];
      const { data, error } = await supabase
        .from("weekly_challenge_results")
        .select("*")
        .eq("challenge_id", currentChallenge.id)
        .order("total_score", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as WeeklyResult[];
    },
    enabled: !!currentChallenge,
  });

  // Get user's current result
  const { data: userResult } = useQuery({
    queryKey: ["user-weekly-result", currentChallenge?.id, user?.id],
    queryFn: async () => {
      if (!currentChallenge || !user) return null;
      const { data, error } = await supabase
        .from("weekly_challenge_results")
        .select("*")
        .eq("challenge_id", currentChallenge.id)
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as WeeklyResult | null;
    },
    enabled: !!currentChallenge && !!user,
  });

  const getFormulaLabel = (type: string) => {
    const labels: Record<string, string> = {
      oddiy: "Oddiy",
      formula5: "5-formula",
      formula10plus: "10+ formula",
      formula10minus: "10- formula",
      hammasi: "Hammasi",
    };
    return labels[type] || type;
  };

  const getTimeRemaining = () => {
    if (!currentChallenge) return null;
    const end = new Date(currentChallenge.week_end);
    end.setHours(23, 59, 59);
    const now = new Date();
    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;
    return { days, hours };
  };

  const timeRemaining = getTimeRemaining();
  const userRank = leaderboard?.findIndex((r) => r.user_id === user?.id) ?? -1;

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-amber-400 animate-bounce" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  const handlePlayClick = () => {
    // Small celebration animation
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#8b5cf6', '#ec4899', '#10b981']
    });
    navigate("/weekly-game");
  };

  if (loadingChallenge) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-muted-foreground animate-pulse">Yuklanmoqda...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentChallenge) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20 overflow-hidden">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-500/20 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-white" />
              </div>
            </div>
            <h3 className="font-display font-bold text-xl mb-2">Haftalik musobaqa mavjud emas</h3>
            <p className="text-sm text-muted-foreground">Tez orada yangi musobaqa e'lon qilinadi!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Challenge Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600/90 via-pink-500/80 to-orange-400/70 border-0 shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Floating particles */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        
        <CardContent className="relative p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Haftalik Musobaqa</h2>
                  <p className="text-white/80 text-sm">
                    {format(new Date(currentChallenge.week_start), "d MMM")} - {format(new Date(currentChallenge.week_end), "d MMM yyyy")}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {getFormulaLabel(currentChallenge.formula_type)}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {currentChallenge.digit_count} xonali
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {currentChallenge.speed}s tezlik
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {currentChallenge.problem_count} misol
                </Badge>
              </div>
            </div>

            {timeRemaining && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Clock className="h-5 w-5 text-yellow-300" />
                <div>
                  <p className="text-xs text-white/70">Qolgan vaqt</p>
                  <p className="text-lg font-bold">
                    {timeRemaining.days}k {timeRemaining.hours}s
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User's Current Stats */}
          {userResult && (
            <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/80 text-sm">Sizning natijangiz</span>
                <Badge className="bg-yellow-400 text-yellow-900 font-bold">
                  #{userRank + 1} o'rin
                </Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userResult.total_score}</p>
                  <p className="text-[10px] text-white/60">Ball</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userResult.games_played}</p>
                  <p className="text-[10px] text-white/60">O'yin</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userResult.correct_answers}</p>
                  <p className="text-[10px] text-white/60">To'g'ri</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userResult.best_time?.toFixed(1) || '-'}s</p>
                  <p className="text-[10px] text-white/60">Eng yaxshi</p>
                </div>
              </div>
            </div>
          )}

          {/* Play Button */}
          {user && (
            <Button 
              className="w-full mt-4 h-14 text-lg font-bold bg-white text-purple-600 hover:bg-white/90 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handlePlayClick}
            >
              <Play className="h-6 w-6 mr-2" />
              O'ynash
              <Sparkles className="h-5 w-5 ml-2" />
            </Button>
          )}

          {!user && (
            <div className="mt-4 text-center py-3 px-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <p className="text-sm text-white/80">Ishtirok etish uchun tizimga kiring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Types */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CHALLENGE_TYPES.map((type, index) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.id}
              className={`${type.bg} border-0 cursor-pointer transition-all hover:scale-105 hover:shadow-lg animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                <p className="font-semibold text-sm">{type.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{type.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for Leaderboard */}
      <Card className="overflow-hidden">
        <Tabs defaultValue="leaderboard" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="w-full">
              <TabsTrigger value="leaderboard" className="flex-1">
                <TrendingUp className="h-4 w-4 mr-2" />
                Reyting
              </TabsTrigger>
              <TabsTrigger value="top3" className="flex-1">
                <Crown className="h-4 w-4 mr-2" />
                Top 3
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <TabsContent value="leaderboard" className="mt-0">
            <CardContent className="pt-4">
              {!leaderboard?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Hali ishtirokchilar yo'q</p>
                  <p className="text-xs mt-1">Birinchi bo'ling!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((result, index) => {
                    const isCurrentUser = result.user_id === user?.id;
                    return (
                      <div
                        key={result.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                          isCurrentUser
                            ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-2 border-primary/40 shadow-lg shadow-primary/10 animate-pulse-slow"
                            : index < 3
                            ? "bg-gradient-to-r from-amber-500/10 to-transparent"
                            : "hover:bg-muted/50"
                        }`}
                        style={{
                          animation: animatingRank === index ? 'rank-up 0.5s ease-out' : undefined
                        }}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {getRankIcon(index)}
                        </div>
                        <Avatar className={`h-10 w-10 ${isCurrentUser ? "ring-2 ring-primary" : index < 3 ? "ring-2 ring-amber-400/50" : ""}`}>
                          <AvatarImage src={result.avatar_url || undefined} />
                          <AvatarFallback className={`text-xs font-bold ${
                            index === 0 ? 'bg-amber-400 text-amber-900' : 
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-amber-700 text-amber-100' : ''
                          }`}>
                            {result.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate flex items-center gap-2 ${isCurrentUser ? "text-primary font-bold" : ""}`}>
                            {result.username}
                            {isCurrentUser && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-primary/20 text-primary">
                                Siz
                              </Badge>
                            )}
                            {index === 0 && (
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{result.games_played} o'yin</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {result.correct_answers}
                            </span>
                            {result.best_time && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-amber-500" />
                                  {result.best_time.toFixed(1)}s
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            isCurrentUser ? "text-primary" : 
                            index === 0 ? "text-amber-500" : 
                            "text-primary"
                          }`}>
                            {result.total_score}
                          </div>
                          <div className="text-[10px] text-muted-foreground">ball</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="top3" className="mt-0">
            <CardContent className="pt-4">
              {leaderboard && leaderboard.length >= 3 ? (
                <div className="relative flex items-end justify-center gap-4 h-64 px-4">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <Avatar className="h-16 w-16 border-4 border-gray-300 shadow-xl mb-2 ring-4 ring-gray-300/30">
                      <AvatarImage src={leaderboard[1]?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-300 text-gray-700 font-bold text-xl">
                        {leaderboard[1]?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate max-w-[80px]">{leaderboard[1]?.username}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[1]?.total_score} ball</p>
                    <div className="w-24 h-24 bg-gradient-to-t from-gray-400 to-gray-200 rounded-t-2xl flex items-center justify-center mt-2 shadow-lg">
                      <span className="text-4xl font-black text-gray-600">2</span>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="relative">
                      <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-amber-400 animate-bounce" />
                      <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
                      <Avatar className="relative h-20 w-20 border-4 border-amber-400 shadow-2xl ring-4 ring-amber-400/40">
                        <AvatarImage src={leaderboard[0]?.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-400 text-amber-900 font-bold text-2xl">
                          {leaderboard[0]?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <p className="font-bold text-base mt-2 truncate max-w-[100px]">{leaderboard[0]?.username}</p>
                    <p className="text-sm font-semibold text-amber-500">{leaderboard[0]?.total_score} ball</p>
                    <div className="w-28 h-32 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-2xl flex flex-col items-center justify-center mt-2 shadow-2xl">
                      <Sparkles className="h-5 w-5 text-amber-700 mb-1" />
                      <span className="text-5xl font-black text-amber-800">1</span>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <Avatar className="h-14 w-14 border-4 border-amber-700 shadow-xl mb-2 ring-4 ring-amber-700/30">
                      <AvatarImage src={leaderboard[2]?.avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-700 text-amber-100 font-bold">
                        {leaderboard[2]?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate max-w-[70px]">{leaderboard[2]?.username}</p>
                    <p className="text-xs text-muted-foreground">{leaderboard[2]?.total_score} ball</p>
                    <div className="w-20 h-16 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-2xl flex items-center justify-center mt-2 shadow-lg">
                      <span className="text-3xl font-black text-amber-200">3</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Top 3 uchun kamida 3 ishtirokchi kerak</p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
