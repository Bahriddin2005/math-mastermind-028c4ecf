import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useConfetti } from '@/hooks/useConfetti';

interface BadgePayload {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string;
  description: string | null;
  earned_at: string;
  user_id: string;
}

const BADGE_DISPLAY_INFO: Record<string, { icon: string; name: string; color: string }> = {
  daily_winner: { icon: "🥇", name: "Kunlik g'olib", color: "#f59e0b" },
  weekly_gold: { icon: "🥇", name: "Haftalik oltin", color: "#eab308" },
  weekly_silver: { icon: "🥈", name: "Haftalik kumush", color: "#9ca3af" },
  weekly_bronze: { icon: "🥉", name: "Haftalik bronza", color: "#b45309" },
  weekly_winner: { icon: "🏆", name: "Haftalik chempion", color: "#a855f7" },
  streak_3: { icon: "🔥", name: "Uch kunlik seriya", color: "#f97316" },
  streak_5: { icon: "🔥", name: "Besh kunlik seriya", color: "#f97316" },
  streak_7: { icon: "🔥", name: "Haftalik seriya", color: "#f97316" },
  streak_14: { icon: "⚡", name: "Ikki haftalik seriya", color: "#f59e0b" },
  streak_30: { icon: "⭐", name: "Oylik seriya", color: "#eab308" },
  best_streak_10: { icon: "⚡", name: "Seriya ustasi", color: "#3b82f6" },
  best_streak_25: { icon: "💎", name: "Super seriya", color: "#8b5cf6" },
  solver_100: { icon: "💯", name: "100 masala", color: "#22c55e" },
  solver_500: { icon: "🎯", name: "500 masala", color: "#14b8a6" },
  solver_1000: { icon: "🏆", name: "Ming masala", color: "#f59e0b" },
  score_1000: { icon: "🌟", name: "Ming ball", color: "#3b82f6" },
  score_5000: { icon: "👑", name: "Besh ming ball", color: "#f59e0b" },
  daily_score_500: { icon: "⭐", name: "Kunlik besh yuz", color: "#06b6d4" },
  daily_score_1000: { icon: "🔥", name: "Kunlik ming ball", color: "#f97316" },
  accuracy_95: { icon: "🎯", name: "Super aniqlik", color: "#22c55e" },
  perfect_game: { icon: "💎", name: "Mukammal o'yin", color: "#8b5cf6" },
  first_game: { icon: "🎮", name: "Birinchi qadam", color: "#ec4899" },
  games_10: { icon: "🎲", name: "Faol o'yinchi", color: "#8b5cf6" },
  games_50: { icon: "🎖️", name: "Tajribali", color: "#64748b" },
};

export const useBadgeNotifications = () => {
  const { user } = useAuth();
  const { triggerAchievementConfetti } = useConfetti();
  const notifiedBadges = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Subscribe to realtime badge inserts for current user
    const channel = supabase
      .channel('user-badges-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const badge = payload.new as BadgePayload;
          
          // Prevent duplicate notifications
          if (notifiedBadges.current.has(badge.id)) return;
          notifiedBadges.current.add(badge.id);

          const displayInfo = BADGE_DISPLAY_INFO[badge.badge_type] || {
            icon: badge.badge_icon || "🏆",
            name: badge.badge_name,
            color: "#f59e0b",
          };

          // Trigger confetti
          triggerAchievementConfetti();

          // Show toast notification
          toast.success(`${displayInfo.icon} Yangi mukofot! ${displayInfo.name}`, {
            description: badge.description || undefined,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, triggerAchievementConfetti]);
};
