import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Trophy, Medal, Star, Crown, Zap, Target, Flame } from "lucide-react";
import { format } from "date-fns";

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  description: string | null;
  earned_at: string;
  competition_type: string | null;
}

const BADGE_DEFINITIONS = [
  // Competition badges
  { type: "daily_winner", name: "Kunlik g'olib", icon: "🥇", color: "from-yellow-500 to-amber-500", description: "Kunlik musobaqada 1-o'rin" },
  { type: "weekly_winner", name: "Haftalik chempion", icon: "🏆", color: "from-purple-500 to-pink-500", description: "Haftalik musobaqada 1-o'rin" },
  
  // Streak badges
  { type: "streak_7", name: "Haftalik seriya", icon: "🔥", color: "from-orange-500 to-red-500", description: "7 kun ketma-ket mashq" },
  { type: "streak_30", name: "Oylik seriya", icon: "⭐", color: "from-amber-500 to-yellow-500", description: "30 kun ketma-ket mashq" },
  { type: "best_streak_10", name: "Seriya ustasi", icon: "⚡", color: "from-blue-500 to-cyan-500", description: "10+ ketma-ket to'g'ri javob" },
  { type: "best_streak_25", name: "Super seriya", icon: "💎", color: "from-indigo-500 to-purple-500", description: "25+ ketma-ket to'g'ri javob" },
  
  // Problem solver badges
  { type: "solver_100", name: "100 masala", icon: "💯", color: "from-green-500 to-emerald-500", description: "100 ta masala yechish" },
  { type: "solver_500", name: "500 masala", icon: "🎯", color: "from-teal-500 to-green-500", description: "500 ta masala yechish" },
  { type: "solver_1000", name: "Ming masala", icon: "🏆", color: "from-yellow-500 to-orange-500", description: "1000 ta masala yechish" },
  
  // Score badges
  { type: "score_1000", name: "Ming ball", icon: "🌟", color: "from-blue-500 to-indigo-500", description: "1000 ball to'plash" },
  { type: "score_5000", name: "Besh ming ball", icon: "👑", color: "from-amber-500 to-orange-500", description: "5000 ball to'plash" },
  
  // Game badges
  { type: "first_game", name: "Birinchi qadam", icon: "🎮", color: "from-pink-500 to-rose-500", description: "Birinchi o'yinni o'ynash" },
  { type: "games_10", name: "Faol o'yinchi", icon: "🎲", color: "from-violet-500 to-purple-500", description: "10 ta o'yin o'ynash" },
  { type: "games_50", name: "Tajribali", icon: "🎖️", color: "from-slate-500 to-zinc-500", description: "50 ta o'yin o'ynash" },
];

export const UserBadges = ({ userId }: { userId?: string }) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const { data: badges, isLoading } = useQuery({
    queryKey: ["user-badges", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", targetUserId)
        .order("earned_at", { ascending: false });
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!targetUserId,
  });

  // Group badges by type and count
  const badgeCounts = badges?.reduce((acc, badge) => {
    acc[badge.badge_type] = (acc[badge.badge_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const uniqueBadgeTypes = [...new Set(badges?.map((b) => b.badge_type) || [])];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">Yuklanmoqda...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Award className="h-5 w-5 text-amber-500" />
          Mukofotlar va yutuqlar
          {badges && badges.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {badges.length} ta
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {!badges?.length ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-amber-500/50" />
            </div>
            <h3 className="font-medium mb-1">Hali mukofotlar yo'q</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Musobaqalarda qatnashing va g'olib bo'lib mukofotlar yutib oling!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Badge Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {uniqueBadgeTypes.map((type) => {
                const definition = BADGE_DEFINITIONS.find((b) => b.type === type);
                const count = badgeCounts[type] || 0;
                const latestBadge = badges?.find((b) => b.badge_type === type);

                return (
                  <div
                    key={type}
                    className="relative group cursor-pointer"
                    title={definition?.description || latestBadge?.description || ""}
                  >
                    <div
                      className={`aspect-square rounded-xl bg-gradient-to-br ${
                        definition?.color || "from-gray-500 to-gray-600"
                      } p-0.5 shadow-lg hover:scale-105 transition-transform`}
                    >
                      <div className="w-full h-full rounded-[10px] bg-card flex flex-col items-center justify-center">
                        <span className="text-2xl md:text-3xl">
                          {definition?.icon || latestBadge?.badge_icon || "🏆"}
                        </span>
                        {count > 1 && (
                          <span className="text-[10px] font-bold text-muted-foreground mt-1">
                            x{count}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="text-xs font-medium">
                        {definition?.name || latestBadge?.badge_name}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {definition?.description || latestBadge?.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Badges List */}
            {badges.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium text-muted-foreground">Oxirgi mukofotlar</h4>
                <div className="space-y-1.5">
                  {badges.slice(0, 5).map((badge) => {
                    const definition = BADGE_DEFINITIONS.find((b) => b.type === badge.badge_type);
                    return (
                      <div
                        key={badge.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <span className="text-lg">{definition?.icon || badge.badge_icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {definition?.name || badge.badge_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {badge.competition_type === "daily"
                              ? "Kunlik musobaqa"
                              : badge.competition_type === "weekly"
                              ? "Haftalik musobaqa"
                              : "Yutuq"}
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(badge.earned_at), "dd.MM.yy")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
