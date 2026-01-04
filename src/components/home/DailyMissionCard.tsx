import { useState, useEffect } from 'react';
import { Target, Clock, Zap, Gift, ChevronRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: {
    type: 'coins' | 'xp' | 'energy';
    amount: number;
  };
  icon: string;
  timeLimit?: number; // minutes
}

interface DailyMissionCardProps {
  missions?: Mission[];
  onStartMission?: (missionId: string) => void;
  onClaimReward?: (missionId: string) => void;
}

const defaultMissions: Mission[] = [
  {
    id: 'quick-practice',
    title: '9 ta misolni yech',
    description: "Tez mashq - aqlingni charxla!",
    target: 9,
    current: 0,
    reward: { type: 'coins', amount: 50 },
    icon: '🎯',
    timeLimit: 5
  },
  {
    id: 'speed-challenge',
    title: 'Tezlik sinovidan o\'t',
    description: '30 soniyada 5 ta misol',
    target: 5,
    current: 0,
    reward: { type: 'xp', amount: 100 },
    icon: '⚡'
  },
  {
    id: 'memory-boost',
    title: 'Xotira mashqi',
    description: '3 xonali sonlar bilan mashq',
    target: 3,
    current: 0,
    reward: { type: 'energy', amount: 3 },
    icon: '🧠'
  }
];

export const DailyMissionCard = ({ 
  missions = defaultMissions,
  onStartMission,
  onClaimReward 
}: DailyMissionCardProps) => {
  const [expandedMission, setExpandedMission] = useState<string | null>(null);

  const getRewardIcon = (type: Mission['reward']['type']) => {
    switch (type) {
      case 'coins': return '💰';
      case 'xp': return '⭐';
      case 'energy': return '⚡';
    }
  };

  return (
    <div className="relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl" />

      <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Kundalik missiyalar</h3>
              <p className="text-xs text-muted-foreground">3-7 daqiqalik vazifalar</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Yangilanishga: 12s</span>
          </div>
        </div>

        {/* Missions list */}
        <div className="divide-y divide-border/30">
          {missions.map((mission, index) => {
            const isCompleted = mission.current >= mission.target;
            const progress = Math.min((mission.current / mission.target) * 100, 100);
            const isExpanded = expandedMission === mission.id;

            return (
              <div 
                key={mission.id}
                className={cn(
                  "p-4 transition-all duration-300",
                  isCompleted && "bg-primary/5"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedMission(isExpanded ? null : mission.id)}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all",
                    isCompleted 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30"
                      : "bg-muted"
                  )}>
                    {isCompleted ? <Check className="w-6 h-6" /> : mission.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn(
                        "font-medium text-sm sm:text-base truncate",
                        isCompleted ? "text-primary" : "text-foreground"
                      )}>
                        {mission.title}
                      </h4>
                      <ChevronRight className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                    
                    {/* Progress */}
                    <div className="mt-1.5">
                      <Progress 
                        value={progress} 
                        className="h-1.5"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {mission.current}/{mission.target}
                        </span>
                        <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                          {getRewardIcon(mission.reward.type)} +{mission.reward.amount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && !isCompleted && (
                  <div className="mt-3 pl-15 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartMission?.(mission.id);
                      }}
                      className="w-full py-2 px-4 bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Boshlash
                      {mission.timeLimit && (
                        <span className="text-xs opacity-80">({mission.timeLimit} daq)</span>
                      )}
                    </button>
                  </div>
                )}

                {/* Claim reward button */}
                {isCompleted && (
                  <button
                    onClick={() => onClaimReward?.(mission.id)}
                    className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Gift className="w-4 h-4" />
                    Sovrinni olish
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
