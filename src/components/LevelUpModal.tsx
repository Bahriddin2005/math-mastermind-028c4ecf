import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PandaMascot } from './PandaMascot';
import { useConfetti } from '@/hooks/useConfetti';
import { Sparkles, Star, Trophy, Zap } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  xpEarned?: number;
}

export const LevelUpModal = ({ isOpen, onClose, newLevel, xpEarned }: LevelUpModalProps) => {
  const { triggerLevelUpConfetti } = useConfetti();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti when modal opens
      triggerLevelUpConfetti();
      
      // Delay content animation
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen, triggerLevelUpConfetti]);

  const getLevelMessage = (level: number) => {
    if (level <= 5) return "Zo'r boshladingiz! 🌟";
    if (level <= 10) return "Ajoyib! Davom eting! 🔥";
    if (level <= 20) return "Super yulduz! ⭐";
    if (level <= 50) return "Matematik dahosi! 🧠";
    return "Afsonaviy o'yinchi! 👑";
  };

  const getLevelBadge = (level: number) => {
    if (level <= 5) return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (level <= 10) return { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/20' };
    if (level <= 20) return { icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
    return { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/20' };
  };

  const badge = getLevelBadge(newLevel);
  const BadgeIcon = badge.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-0 bg-transparent border-0 shadow-none">
        <div 
          className={`relative bg-gradient-to-b from-card via-card to-card/95 rounded-3xl p-6 border-2 border-primary/30 shadow-2xl overflow-hidden transition-all duration-500 ${
            showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-warning/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Floating stars */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute text-warning animate-float"
                style={{
                  left: `${10 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  animationDelay: `${i * 0.3}s`,
                  fontSize: `${12 + (i % 3) * 4}px`,
                }}
              >
                ⭐
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Level badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${badge.bg} mb-4`}>
              <BadgeIcon className={`h-4 w-4 ${badge.color}`} />
              <span className={`text-sm font-bold ${badge.color}`}>LEVEL UP!</span>
              <BadgeIcon className={`h-4 w-4 ${badge.color}`} />
            </div>

            {/* Panda mascot */}
            <div className="relative my-4">
              <PandaMascot 
                mood="celebrating" 
                size="xl" 
                showMessage={false}
              />
            </div>

            {/* Level number */}
            <div className="relative">
              <div className="text-7xl font-black bg-gradient-to-r from-primary via-warning to-primary bg-clip-text text-transparent animate-pulse">
                {newLevel}
              </div>
              <p className="text-lg font-bold text-foreground mt-1">-daraja</p>
            </div>

            {/* Congratulations message */}
            <div className="mt-4 space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Tabriklaymiz! 🎉
              </h2>
              <p className="text-muted-foreground">
                {getLevelMessage(newLevel)}
              </p>
              
              {xpEarned && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium mt-2">
                  <Sparkles className="h-4 w-4" />
                  +{xpEarned} XP
                </div>
              )}
            </div>

            {/* Continue button */}
            <Button
              onClick={onClose}
              className="w-full h-12 mt-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg"
            >
              Davom etish 🚀
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
