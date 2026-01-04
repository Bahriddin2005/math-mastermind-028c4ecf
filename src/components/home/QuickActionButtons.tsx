import { Sword, Users, Trophy, BookOpen, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonsProps {
  onBattle: () => void;
  onFriends: () => void;
  onRanking: () => void;
  onLearn: () => void;
  disabled?: boolean;
}

const actions = [
  {
    key: 'battle',
    label: 'Battle',
    emoji: '⚔️',
    icon: Sword,
    color: 'from-purple-500 to-indigo-600',
    shadowColor: 'shadow-purple-500/30',
    description: "Do'st bilan"
  },
  {
    key: 'friends',
    label: "Do'stlar",
    emoji: '👥',
    icon: Users,
    color: 'from-blue-500 to-cyan-600',
    shadowColor: 'shadow-blue-500/30',
    description: 'Chat'
  },
  {
    key: 'ranking',
    label: 'Reyting',
    emoji: '🏆',
    icon: Trophy,
    color: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/30',
    description: 'Top 10'
  },
  {
    key: 'learn',
    label: "O'rganish",
    emoji: '📚',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/30',
    description: 'Darslar'
  },
];

export const QuickActionButtons = ({
  onBattle,
  onFriends,
  onRanking,
  onLearn,
  disabled = false
}: QuickActionButtonsProps) => {
  
  const handleClick = (key: string) => {
    switch (key) {
      case 'battle': onBattle(); break;
      case 'friends': onFriends(); break;
      case 'ranking': onRanking(); break;
      case 'learn': onLearn(); break;
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {actions.map((action, index) => (
        <button
          key={action.key}
          onClick={() => handleClick(action.key)}
          disabled={disabled}
          className={cn(
            "relative flex flex-col items-center p-3 sm:p-4 rounded-2xl transition-all duration-300",
            "bg-gradient-to-br border border-white/10",
            action.color,
            `shadow-lg ${action.shadowColor}`,
            "hover:scale-105 hover:shadow-xl active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "animate-fade-in"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Icon */}
          <span className="text-2xl sm:text-3xl mb-1">{action.emoji}</span>
          
          {/* Label */}
          <span className="text-xs sm:text-sm font-bold text-white/90 truncate w-full text-center">
            {action.label}
          </span>
          
          {/* Description */}
          <span className="text-[10px] text-white/60 hidden sm:block">
            {action.description}
          </span>
        </button>
      ))}
    </div>
  );
};
