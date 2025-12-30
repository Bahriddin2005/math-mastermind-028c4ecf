import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Calendar, Clock, Users, Play, Medal, Crown, Star } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours } from "date-fns";

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

export const WeeklyCompetition = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

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
        .limit(10);
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

  // Submit result mutation
  const submitResultMutation = useMutation({
    mutationFn: async (result: { score: number; correct: number; time: number }) => {
      if (!currentChallenge || !user || !profile) throw new Error("Missing data");

      if (userResult) {
        // Update existing result
        const { error } = await supabase
          .from("weekly_challenge_results")
          .update({
            total_score: userResult.total_score + result.score,
            games_played: userResult.games_played + 1,
            correct_answers: userResult.correct_answers + result.correct,
            best_time: userResult.best_time
              ? Math.min(userResult.best_time, result.time)
              : result.time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userResult.id);
        if (error) throw error;
      } else {
        // Create new result
        const { error } = await supabase.from("weekly_challenge_results").insert({
          challenge_id: currentChallenge.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          total_score: result.score,
          games_played: 1,
          correct_answers: result.correct,
          best_time: result.time,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["user-weekly-result"] });
      toast.success("Natija saqlandi!");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
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
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  if (loadingChallenge) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Yuklanmoqda...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentChallenge) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">Haftalik musobaqa mavjud emas</h3>
            <p className="text-sm text-muted-foreground">Tez orada yangi musobaqa e'lon qilinadi!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Challenge Info Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border-purple-500/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Trophy className="h-5 w-5 text-purple-500" />
              Haftalik Musobaqa
            </CardTitle>
            {timeRemaining && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining.days}k {timeRemaining.hours}s qoldi
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{getFormulaLabel(currentChallenge.formula_type)}</Badge>
            <Badge variant="outline">{currentChallenge.digit_count} xonali</Badge>
            <Badge variant="outline">{currentChallenge.speed}s tezlik</Badge>
            <Badge variant="outline">{currentChallenge.problem_count} misol</Badge>
          </div>

          <div className="text-xs text-muted-foreground">
            {format(new Date(currentChallenge.week_start), "d MMM")} -{" "}
            {format(new Date(currentChallenge.week_end), "d MMM yyyy")}
          </div>

          {userResult && (
            <div className="bg-card/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sizning natijangiz</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {userRank >= 0 ? `#${userRank + 1}` : "-"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{userResult.total_score}</div>
                  <div className="text-[10px] text-muted-foreground">Ball</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{userResult.games_played}</div>
                  <div className="text-[10px] text-muted-foreground">O'yin</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{userResult.correct_answers}</div>
                  <div className="text-[10px] text-muted-foreground">To'g'ri</div>
                </div>
              </div>
            </div>
          )}

          {user && (
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => navigate("/weekly-game")}
            >
              <Play className="h-4 w-4" />
              O'ynash
            </Button>
          )}

          {!user && (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground mb-2">Ishtirok etish uchun tizimga kiring</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Haftalik reyting
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!leaderboard?.length ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Hali ishtirokchilar yo'q. Birinchi bo'ling!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((result, index) => (
                <div
                  key={result.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    result.user_id === user?.id
                      ? "bg-primary/10 border border-primary/20"
                      : index < 3
                      ? "bg-secondary/50"
                      : ""
                  }`}
                >
                  <div className="w-6 flex items-center justify-center">{getRankIcon(index)}</div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {result.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{result.username}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {result.games_played} o'yin · {result.correct_answers} to'g'ri
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{result.total_score}</div>
                    <div className="text-[10px] text-muted-foreground">ball</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
