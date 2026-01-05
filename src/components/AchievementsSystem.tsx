import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useConfetti } from '@/hooks/useConfetti';
import { toast } from 'sonner';
import { 
  Trophy, 
  Star, 
  Flame, 
  Zap, 
  Crown,
  Medal,
  Target,
  Rocket,
  Brain,
  Lock,
  Check,
  Sparkles,
  Gift,
  ShieldCheck,
  Gem,
  Heart,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced achievement categories with rewards
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgGradient: string;
  category: 'streak' | 'problems' | 'score' | 'special' | 'social';
  requirement: number;
  type: 'problems' | 'streak' | 'score' | 'level' | 'xp' | 'special';
  reward: {
    coins: number;
    xp: number;
    special?: string; // special unlock like avatar frame, skin, etc.
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isSecret?: boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'streak_3',
    name: '3 kunlik seriya',
    description: '3 kun ketma-ket mashq qilish',
    icon: '🔥',
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    category: 'streak',
    requirement: 3,
    type: 'streak',
    reward: { coins: 50, xp: 100 },
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Haftalik seriya',
    description: '7 kun ketma-ket mashq qilish',
    icon: '🔥',
    color: 'text-orange-600',
    bgGradient: 'from-orange-600/20 to-red-600/20',
    category: 'streak',
    requirement: 7,
    type: 'streak',
    reward: { coins: 150, xp: 300 },
    rarity: 'rare',
  },
  {
    id: 'streak_14',
    name: 'Super seriya',
    description: '14 kun ketma-ket mashq qilish',
    icon: '⚡',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-orange-500/20',
    category: 'streak',
    requirement: 14,
    type: 'streak',
    reward: { coins: 300, xp: 600, special: 'frame_fire' },
    rarity: 'epic',
  },
  {
    id: 'streak_30',
    name: 'Oylik seriya',
    description: '30 kun ketma-ket mashq qilish',
    icon: '👑',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/20 to-yellow-500/20',
    category: 'streak',
    requirement: 30,
    type: 'streak',
    reward: { coins: 1000, xp: 2000, special: 'frame_legendary' },
    rarity: 'legendary',
  },

  // PROBLEMS ACHIEVEMENTS
  {
    id: 'problems_10',
    name: 'Birinchi qadam',
    description: '10 ta masala yechish',
    icon: '🎯',
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 to-cyan-500/20',
    category: 'problems',
    requirement: 10,
    type: 'problems',
    reward: { coins: 20, xp: 50 },
    rarity: 'common',
  },
  {
    id: 'problems_50',
    name: '50 masala',
    description: '50 ta masala yechish',
    icon: '🧮',
    color: 'text-blue-600',
    bgGradient: 'from-blue-600/20 to-indigo-500/20',
    category: 'problems',
    requirement: 50,
    type: 'problems',
    reward: { coins: 100, xp: 200 },
    rarity: 'common',
  },
  {
    id: 'problems_100',
    name: 'Yuz masala',
    description: '100 ta masala yechish',
    icon: '💯',
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-500/20 to-purple-500/20',
    category: 'problems',
    requirement: 100,
    type: 'problems',
    reward: { coins: 200, xp: 400 },
    rarity: 'rare',
  },
  {
    id: 'problems_500',
    name: 'Matematik',
    description: '500 ta masala yechish',
    icon: '🧠',
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    category: 'problems',
    requirement: 500,
    type: 'problems',
    reward: { coins: 500, xp: 1000, special: 'skin_math' },
    rarity: 'epic',
  },
  {
    id: 'problems_1000',
    name: 'Usta',
    description: '1000 ta masala yechish',
    icon: '🏆',
    color: 'text-pink-500',
    bgGradient: 'from-pink-500/20 to-rose-500/20',
    category: 'problems',
    requirement: 1000,
    type: 'problems',
    reward: { coins: 1500, xp: 3000, special: 'title_master' },
    rarity: 'legendary',
  },

  // SCORE ACHIEVEMENTS
  {
    id: 'score_500',
    name: '500 ball',
    description: '500 ball to\'plash',
    icon: '⭐',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500/20 to-amber-500/20',
    category: 'score',
    requirement: 500,
    type: 'score',
    reward: { coins: 50, xp: 100 },
    rarity: 'common',
  },
  {
    id: 'score_2000',
    name: 'Ikki ming ball',
    description: '2000 ball to\'plash',
    icon: '🌟',
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/20 to-orange-500/20',
    category: 'score',
    requirement: 2000,
    type: 'score',
    reward: { coins: 150, xp: 300 },
    rarity: 'rare',
  },
  {
    id: 'score_5000',
    name: 'Besh ming ball',
    description: '5000 ball to\'plash',
    icon: '💫',
    color: 'text-orange-500',
    bgGradient: 'from-orange-500/20 to-red-500/20',
    category: 'score',
    requirement: 5000,
    type: 'score',
    reward: { coins: 400, xp: 800, special: 'frame_star' },
    rarity: 'epic',
  },
  {
    id: 'score_10000',
    name: 'O\'n ming ball',
    description: '10000 ball to\'plash',
    icon: '👑',
    color: 'text-amber-600',
    bgGradient: 'from-amber-600/20 to-yellow-600/20',
    category: 'score',
    requirement: 10000,
    type: 'score',
    reward: { coins: 1000, xp: 2000, special: 'title_champion' },
    rarity: 'legendary',
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'perfect_10',
    name: 'Mukammal 10',
    description: '10 ta ketma-ket to\'g\'ri javob',
    icon: '💎',
    color: 'text-cyan-500',
    bgGradient: 'from-cyan-500/20 to-blue-500/20',
    category: 'special',
    requirement: 10,
    type: 'special',
    reward: { coins: 100, xp: 200 },
    rarity: 'rare',
  },
  {
    id: 'perfect_25',
    name: 'Super aniqlik',
    description: '25 ta ketma-ket to\'g\'ri javob',
    icon: '💠',
    color: 'text-violet-500',
    bgGradient: 'from-violet-500/20 to-purple-500/20',
    category: 'special',
    requirement: 25,
    type: 'special',
    reward: { coins: 300, xp: 600, special: 'frame_diamond' },
    rarity: 'epic',
  },
  {
    id: 'speed_demon',
    name: 'Tez o\'ylash',
    description: '10 masalani 30 soniyada yechish',
    icon: '⚡',
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-400/20 to-amber-400/20',
    category: 'special',
    requirement: 1,
    type: 'special',
    reward: { coins: 200, xp: 400, special: 'effect_lightning' },
    rarity: 'epic',
    isSecret: true,
  },
  {
    id: 'early_bird',
    name: 'Erta qaldirg\'och',
    description: 'Ertalab 6 da mashq qilish',
    icon: '🌅',
    color: 'text-orange-400',
    bgGradient: 'from-orange-400/20 to-yellow-400/20',
    category: 'special',
    requirement: 1,
    type: 'special',
    reward: { coins: 50, xp: 100 },
    rarity: 'rare',
    isSecret: true,
  },
];

interface AchievementsSystemProps {
  stats: {
    totalProblems: number;
    currentStreak: number;
    bestStreak: number;
    totalScore: number;
    level: number;
    totalXp: number;
  };
  className?: string;
  showAll?: boolean;
}

export const AchievementsSystem = ({ stats, className, showAll = false }: AchievementsSystemProps) => {
  const { user } = useAuth();
  const { triggerAchievementConfetti } = useConfetti();
  const [earnedAchievements, setEarnedAchievements] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Check if achievement is earned
  const checkAchievement = (achievement: Achievement): boolean => {
    switch (achievement.type) {
      case 'problems':
        return stats.totalProblems >= achievement.requirement;
      case 'streak':
        return stats.currentStreak >= achievement.requirement || stats.bestStreak >= achievement.requirement;
      case 'score':
        return stats.totalScore >= achievement.requirement;
      case 'level':
        return stats.level >= achievement.requirement;
      case 'xp':
        return stats.totalXp >= achievement.requirement;
      case 'special':
        // Special achievements need different checking logic
        if (achievement.id === 'perfect_10') {
          return stats.bestStreak >= 10;
        }
        if (achievement.id === 'perfect_25') {
          return stats.bestStreak >= 25;
        }
        return false;
      default:
        return false;
    }
  };

  // Get progress percentage
  const getProgress = (achievement: Achievement): number => {
    let current = 0;
    switch (achievement.type) {
      case 'problems':
        current = stats.totalProblems;
        break;
      case 'streak':
        current = Math.max(stats.currentStreak, stats.bestStreak);
        break;
      case 'score':
        current = stats.totalScore;
        break;
      case 'level':
        current = stats.level;
        break;
      case 'xp':
        current = stats.totalXp;
        break;
      case 'special':
        if (achievement.id.startsWith('perfect')) {
          current = stats.bestStreak;
        }
        break;
    }
    return Math.min((current / achievement.requirement) * 100, 100);
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-400 bg-gray-100 dark:bg-gray-800';
      case 'rare':
        return 'border-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'epic':
        return 'border-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'legendary':
        return 'border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30';
      default:
        return 'border-border bg-secondary';
    }
  };

  // Get rarity badge
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return { label: 'Oddiy', color: 'bg-gray-500' };
      case 'rare':
        return { label: 'Kam', color: 'bg-blue-500' };
      case 'epic':
        return { label: 'Epic', color: 'bg-purple-500' };
      case 'legendary':
        return { label: 'Afsonaviy', color: 'bg-gradient-to-r from-amber-500 to-yellow-500' };
      default:
        return { label: 'Oddiy', color: 'bg-gray-500' };
    }
  };

  // Filter achievements
  const filteredAchievements = selectedCategory === 'all' 
    ? ACHIEVEMENTS.filter(a => !a.isSecret || checkAchievement(a))
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory && (!a.isSecret || checkAchievement(a)));

  const earnedCount = ACHIEVEMENTS.filter(a => checkAchievement(a)).length;
  const totalCount = ACHIEVEMENTS.filter(a => !a.isSecret).length;

  // Categories with icons
  const categories = [
    { id: 'all', name: 'Hammasi', icon: Award, count: ACHIEVEMENTS.length },
    { id: 'streak', name: 'Seriya', icon: Flame, count: ACHIEVEMENTS.filter(a => a.category === 'streak').length },
    { id: 'problems', name: 'Masalalar', icon: Target, count: ACHIEVEMENTS.filter(a => a.category === 'problems').length },
    { id: 'score', name: 'Ball', icon: Star, count: ACHIEVEMENTS.filter(a => a.category === 'score').length },
    { id: 'special', name: 'Maxsus', icon: Sparkles, count: ACHIEVEMENTS.filter(a => a.category === 'special').length },
  ];

  // Handle claim reward (mock)
  const handleClaimReward = (achievement: Achievement) => {
    triggerAchievementConfetti();
    toast.success(`🎉 "${achievement.name}" mukofoti olindi!`, {
      description: `+${achievement.reward.coins} tanga, +${achievement.reward.xp} XP`,
    });
    setSelectedAchievement(null);
  };

  if (!showAll) {
    // Compact view - show recent/close achievements
    const nearAchievements = ACHIEVEMENTS
      .filter(a => !checkAchievement(a) && !a.isSecret)
      .sort((a, b) => getProgress(b) - getProgress(a))
      .slice(0, 3);

    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold">Yutuqlar</span>
                <p className="text-xs text-muted-foreground font-normal">
                  {earnedCount}/{totalCount} qo'lga kiritildi
                </p>
              </div>
            </CardTitle>
            <Button variant="outline" size="sm" className="text-xs h-7">
              <a href="/achievements">Barchasi</a>
            </Button>
          </div>
          <Progress value={(earnedCount / totalCount) * 100} className="h-1.5 mt-2" />
        </CardHeader>
        
        <CardContent className="pt-3">
          <p className="text-xs text-muted-foreground mb-3">Yaqin maqsadlar:</p>
          <div className="space-y-2">
            {nearAchievements.map(achievement => {
              const progress = getProgress(achievement);
              const rarity = getRarityBadge(achievement.rarity);
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:scale-[1.02]',
                    getRarityColor(achievement.rarity)
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
                    `bg-gradient-to-br ${achievement.bgGradient}`
                  )}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{achievement.name}</p>
                      <Badge className={cn('text-[10px] h-4 px-1.5', rarity.color, 'text-white')}>
                        {rarity.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    <Gift className="h-3 w-3 inline mr-0.5" />
                    {achievement.reward.coins}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Yutuqlar</h1>
                <p className="text-muted-foreground">Mukofotlarni yig'ib, qo'shimcha imkoniyatlar oching</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{earnedCount}</p>
              <p className="text-sm text-muted-foreground">/ {totalCount}</p>
            </div>
          </div>
          <Progress value={(earnedCount / totalCount) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="gap-1.5 whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAchievements.map(achievement => {
          const isEarned = checkAchievement(achievement);
          const progress = getProgress(achievement);
          const rarity = getRarityBadge(achievement.rarity);
          
          return (
            <Card
              key={achievement.id}
              className={cn(
                'overflow-hidden transition-all cursor-pointer hover:scale-[1.02]',
                isEarned ? 'border-2' : 'opacity-70',
                isEarned && getRarityColor(achievement.rarity)
              )}
              onClick={() => setSelectedAchievement(achievement)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center text-2xl relative',
                    `bg-gradient-to-br ${achievement.bgGradient}`,
                    !isEarned && 'grayscale'
                  )}>
                    {achievement.icon}
                    {isEarned && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {!isEarned && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn('font-bold text-sm', !isEarned && 'text-muted-foreground')}>
                        {achievement.name}
                      </h3>
                      <Badge className={cn('text-[10px] h-4 px-1.5', rarity.color, 'text-white')}>
                        {rarity.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    {!isEarned && (
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground font-medium">{Math.round(progress)}%</span>
                      </div>
                    )}
                    {isEarned && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          +{achievement.reward.coins} 🪙
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          +{achievement.reward.xp} XP
                        </span>
                        {achievement.reward.special && (
                          <span className="text-pink-600 dark:text-pink-400 font-medium">
                            +🎁
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <Card 
            className={cn(
              'max-w-sm w-full overflow-hidden animate-scale-up',
              getRarityColor(selectedAchievement.rarity)
            )}
            onClick={e => e.stopPropagation()}
          >
            <CardContent className="p-6 text-center">
              <div className={cn(
                'w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mx-auto mb-4',
                `bg-gradient-to-br ${selectedAchievement.bgGradient}`,
                !checkAchievement(selectedAchievement) && 'grayscale'
              )}>
                {selectedAchievement.icon}
              </div>
              
              <Badge className={cn('mb-2', getRarityBadge(selectedAchievement.rarity).color, 'text-white')}>
                {getRarityBadge(selectedAchievement.rarity).label}
              </Badge>
              
              <h2 className="text-xl font-bold mb-2">{selectedAchievement.name}</h2>
              <p className="text-muted-foreground mb-4">{selectedAchievement.description}</p>
              
              {/* Rewards */}
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-2">Mukofotlar:</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{selectedAchievement.reward.coins}</p>
                    <p className="text-xs text-muted-foreground">Tanga</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-500">{selectedAchievement.reward.xp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                  {selectedAchievement.reward.special && (
                    <div className="text-center">
                      <p className="text-2xl">🎁</p>
                      <p className="text-xs text-muted-foreground">Maxsus</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress or earned status */}
              {checkAchievement(selectedAchievement) ? (
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Qo'lga kiritildi!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Jarayon</span>
                    <span className="font-bold">{Math.round(getProgress(selectedAchievement))}%</span>
                  </div>
                  <Progress value={getProgress(selectedAchievement)} className="h-2" />
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="mt-4 w-full"
                onClick={() => setSelectedAchievement(null)}
              >
                Yopish
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
