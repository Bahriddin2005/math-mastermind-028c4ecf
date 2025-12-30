import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSound } from "@/hooks/useSound";
import { useNavigate } from "react-router-dom";
import { 
  Award, 
  Trophy, 
  Lock, 
  Check, 
  ArrowLeft,
  Flame,
  Target,
  Star,
  Crown,
  Medal,
  Zap,
  Gamepad2,
  TrendingUp
} from "lucide-react";

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  earned_at: string;
}

// All available badges in the system
const ALL_BADGES = [
  // Competition badges
  { type: "daily_winner", name: "Kunlik g'olib", icon: "🥇", color: "from-yellow-500 to-amber-500", description: "Kunlik musobaqada 1-o'rin", category: "Musobaqalar" },
  { type: "weekly_gold", name: "Haftalik oltin", icon: "🥇", color: "from-yellow-400 to-yellow-600", description: "Haftalik musobaqada 1-o'rin", category: "Musobaqalar" },
  { type: "weekly_silver", name: "Haftalik kumush", icon: "🥈", color: "from-gray-300 to-gray-500", description: "Haftalik musobaqada 2-o'rin", category: "Musobaqalar" },
  { type: "weekly_bronze", name: "Haftalik bronza", icon: "🥉", color: "from-amber-600 to-amber-800", description: "Haftalik musobaqada 3-o'rin", category: "Musobaqalar" },
  { type: "weekly_winner", name: "Haftalik chempion", icon: "🏆", color: "from-purple-500 to-pink-500", description: "Haftalik musobaqada g'olib", category: "Musobaqalar" },
  
  // Streak badges
  { type: "streak_3", name: "Uch kunlik seriya", icon: "🔥", color: "from-orange-400 to-red-400", description: "3 kun ketma-ket mashq", category: "Seriyalar" },
  { type: "streak_5", name: "Besh kunlik seriya", icon: "🔥", color: "from-orange-500 to-red-500", description: "5 kun ketma-ket mashq", category: "Seriyalar" },
  { type: "streak_7", name: "Haftalik seriya", icon: "🔥", color: "from-orange-500 to-red-500", description: "7 kun ketma-ket mashq", category: "Seriyalar" },
  { type: "streak_14", name: "Ikki haftalik seriya", icon: "⚡", color: "from-yellow-500 to-orange-500", description: "14 kun ketma-ket mashq", category: "Seriyalar" },
  { type: "streak_30", name: "Oylik seriya", icon: "⭐", color: "from-amber-500 to-yellow-500", description: "30 kun ketma-ket mashq", category: "Seriyalar" },
  
  // Best streak badges
  { type: "best_streak_10", name: "Seriya ustasi", icon: "⚡", color: "from-blue-500 to-cyan-500", description: "10+ ketma-ket to'g'ri javob", category: "Seriyalar" },
  { type: "best_streak_25", name: "Super seriya", icon: "💎", color: "from-indigo-500 to-purple-500", description: "25+ ketma-ket to'g'ri javob", category: "Seriyalar" },
  
  // Problem solver badges
  { type: "solver_100", name: "100 masala", icon: "💯", color: "from-green-500 to-emerald-500", description: "100 ta masala yechish", category: "Masalalar" },
  { type: "solver_500", name: "500 masala", icon: "🎯", color: "from-teal-500 to-green-500", description: "500 ta masala yechish", category: "Masalalar" },
  { type: "solver_1000", name: "Ming masala", icon: "🏆", color: "from-yellow-500 to-orange-500", description: "1000 ta masala yechish", category: "Masalalar" },
  
  // Score badges
  { type: "score_1000", name: "Ming ball", icon: "🌟", color: "from-blue-500 to-indigo-500", description: "1000 ball to'plash", category: "Ball" },
  { type: "score_5000", name: "Besh ming ball", icon: "👑", color: "from-amber-500 to-orange-500", description: "5000 ball to'plash", category: "Ball" },
  { type: "daily_score_500", name: "Kunlik besh yuz", icon: "⭐", color: "from-cyan-500 to-blue-500", description: "1 kunda 500+ ball", category: "Ball" },
  { type: "daily_score_1000", name: "Kunlik ming ball", icon: "🔥", color: "from-orange-500 to-red-500", description: "1 kunda 1000+ ball", category: "Ball" },
  
  // Accuracy badges
  { type: "accuracy_95", name: "Super aniqlik", icon: "🎯", color: "from-emerald-500 to-green-500", description: "95%+ aniqlik bilan o'yin", category: "Aniqlik" },
  { type: "perfect_game", name: "Mukammal o'yin", icon: "💎", color: "from-violet-500 to-purple-500", description: "100% aniqlik, 10+ masala", category: "Aniqlik" },
  
  // Game badges
  { type: "first_game", name: "Birinchi qadam", icon: "🎮", color: "from-pink-500 to-rose-500", description: "Birinchi o'yinni o'ynash", category: "O'yinlar" },
  { type: "games_10", name: "Faol o'yinchi", icon: "🎲", color: "from-violet-500 to-purple-500", description: "10 ta o'yin o'ynash", category: "O'yinlar" },
  { type: "games_50", name: "Tajribali", icon: "🎖️", color: "from-slate-500 to-zinc-500", description: "50 ta o'yin o'ynash", category: "O'yinlar" },
];

const CATEGORIES = [
  { id: "all", name: "Hammasi", icon: Award },
  { id: "Musobaqalar", name: "Musobaqalar", icon: Trophy },
  { id: "Seriyalar", name: "Seriyalar", icon: Flame },
  { id: "Masalalar", name: "Masalalar", icon: Target },
  { id: "Ball", name: "Ball", icon: Star },
  { id: "Aniqlik", name: "Aniqlik", icon: TrendingUp },
  { id: "O'yinlar", name: "O'yinlar", icon: Gamepad2 },
];

const Badges = () => {
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const navigate = useNavigate();

  const { data: userBadges, isLoading } = useQuery({
    queryKey: ["user-badges-all", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("id, badge_type, badge_name, earned_at")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as UserBadge[];
    },
    enabled: !!user,
  });

  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const earnedBadgeTypes = new Set(userBadges?.map((b) => b.badge_type) || []);
  const earnedCount = earnedBadgeTypes.size;
  const totalCount = ALL_BADGES.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const filteredBadges = selectedCategory === "all" 
    ? ALL_BADGES 
    : ALL_BADGES.filter((b) => b.category === selectedCategory);

  const getBadgeEarnedInfo = (badgeType: string) => {
    const badge = userBadges?.find((b) => b.badge_type === badgeType);
    return badge || null;
  };

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="opacity-0 animate-fade-in"
            style={{ animationFillMode: 'forwards' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>

          {/* Header */}
          <div className="text-center space-y-2 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Badge Kolleksiyasi</h1>
            <p className="text-muted-foreground">Barcha mavjud mukofotlar va yutuqlar</p>
          </div>

          {/* Progress Card */}
          <Card className="overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="font-semibold">Sizning yutuqlaringiz</span>
                </div>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {earnedCount} / {totalCount}
                </Badge>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {totalCount - earnedCount} ta badge yutib olish qoldi
              </p>
            </CardContent>
          </Card>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`gap-1.5 ${isActive ? "" : "hover:bg-secondary"}`}
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            {filteredBadges.map((badge) => {
              const earnedInfo = getBadgeEarnedInfo(badge.type);
              const isEarned = !!earnedInfo;

              return (
                <div
                  key={badge.type}
                  className={`relative group ${!isEarned ? "opacity-60" : ""}`}
                >
                  <Card className={`overflow-hidden transition-all hover:scale-105 ${
                    isEarned 
                      ? "border-primary/30 shadow-lg" 
                      : "border-border/50"
                  }`}>
                    <div className={`h-2 bg-gradient-to-r ${badge.color}`} />
                    <CardContent className="p-4 text-center">
                      <div className="relative mb-3">
                        <div
                          className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${badge.color} p-0.5 ${
                            isEarned ? "shadow-md" : "grayscale"
                          }`}
                        >
                          <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center">
                            <span className={`text-3xl ${!isEarned ? "opacity-50" : ""}`}>
                              {badge.icon}
                            </span>
                          </div>
                        </div>
                        {isEarned ? (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h3 className={`font-semibold text-sm mb-1 ${!isEarned ? "text-muted-foreground" : ""}`}>
                        {badge.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {badge.description}
                      </p>
                      {isEarned && earnedInfo && (
                        <Badge variant="secondary" className="mt-2 text-[10px]">
                          {new Date(earnedInfo.earned_at).toLocaleDateString("uz-UZ")}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Empty state for non-logged in users */}
          {!user && (
            <Card className="text-center py-12">
              <CardContent>
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Tizimga kiring</h3>
                <p className="text-muted-foreground mb-4">
                  Badge'laringizni ko'rish uchun tizimga kiring
                </p>
                <Button onClick={() => navigate("/auth")}>
                  Kirish
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

// Need to import React for useState
import React from "react";

export default Badges;
