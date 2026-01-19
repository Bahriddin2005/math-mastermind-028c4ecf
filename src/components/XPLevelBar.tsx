import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Flame, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPLevelBarProps {
  className?: string;
  compact?: boolean;
}

export const XPLevelBar = ({ className, compact = false }: XPLevelBarProps) => {
  const { user } = useAuth();
  const [gamificationData, setGamificationData] = useState<{
    level: number;
    current_xp: number;
    energy: number;
    combo: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchGamificationData = async () => {
      const { data } = await supabase
        .from('user_gamification')
        .select('level, current_xp, energy, combo')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setGamificationData(data);
      }
    };

    fetchGamificationData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('xp-level-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_gamification',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setGamificationData(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || !gamificationData) {
    return null;
  }

  const level = gamificationData.level || 1;
  const currentXP = gamificationData.current_xp || 0;
  const requiredXP = level * 100; // Simple XP formula: level * 100
  const xpProgress = Math.min((currentXP / requiredXP) * 100, 100);
  const energy = gamificationData.energy || 5;
  const combo = gamificationData.combo || 0;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* Level badge */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-2.5 py-1 border border-primary/30">
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-xs font-bold">{level}</span>
        </div>
        
        {/* XP Progress mini */}
        <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 bg-gradient-to-r from-card/80 via-card/90 to-card/80 backdrop-blur-md rounded-2xl px-4 py-2 border border-border/40 shadow-lg',
      className
    )}>
      {/* Level badge */}
      <div className="relative">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
          <span className="text-white font-black text-lg">{level}</span>
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
          <Star className="w-2.5 h-2.5 text-yellow-800 fill-yellow-600" />
        </div>
      </div>

      {/* XP Progress */}
      <div className="flex-1 min-w-[80px] max-w-[120px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-muted-foreground">XP</span>
          <span className="text-[10px] font-bold text-primary">{currentXP}/{requiredXP}</span>
        </div>
        <div className="h-2.5 bg-secondary/80 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full transition-all duration-500 relative"
            style={{ width: `${xpProgress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Energy */}
      <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl px-2.5 py-1.5 border border-yellow-500/30">
        <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{energy}</span>
      </div>

      {/* Combo (only show if > 0) */}
      {combo > 0 && (
        <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl px-2.5 py-1.5 border border-orange-500/30 animate-pulse">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">x{combo}</span>
        </div>
      )}
    </div>
  );
};
