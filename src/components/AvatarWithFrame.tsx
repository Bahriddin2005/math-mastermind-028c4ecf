import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface AvatarWithFrameProps {
  avatarUrl?: string | null;
  username?: string;
  selectedFrame?: string | null;
  isVip?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const frameStyles: Record<string, { border: string; shadow: string; animation?: string }> = {
  '🏆': { 
    border: 'ring-4 ring-yellow-500', 
    shadow: 'shadow-[0_0_20px_rgba(234,179,8,0.5)]',
    animation: 'animate-pulse'
  },
  '🥈': { 
    border: 'ring-4 ring-slate-400', 
    shadow: 'shadow-[0_0_15px_rgba(148,163,184,0.5)]' 
  },
  '⭐': { 
    border: 'ring-4 ring-amber-400', 
    shadow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
    animation: 'animate-pulse'
  },
  '🔥': { 
    border: 'ring-4 ring-orange-500', 
    shadow: 'shadow-[0_0_25px_rgba(249,115,22,0.6)]',
    animation: 'animate-pulse'
  },
  '🌈': { 
    border: 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-padding', 
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]' 
  },
};

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export const AvatarWithFrame = ({
  avatarUrl,
  username = '',
  selectedFrame,
  isVip,
  size = 'md',
  className = ''
}: AvatarWithFrameProps) => {
  const frameStyle = selectedFrame ? frameStyles[selectedFrame] : null;
  const sizeClass = sizeClasses[size];

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar 
        className={`${sizeClass} ${frameStyle?.border || ''} ${frameStyle?.shadow || ''} ${frameStyle?.animation || ''} transition-all`}
      >
        <AvatarImage src={avatarUrl || undefined} alt={username} />
        <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {/* Frame icon overlay */}
      {selectedFrame && (
        <div className="absolute -bottom-1 -right-1 text-sm">
          {selectedFrame}
        </div>
      )}
      
      {/* VIP badge */}
      {isVip && (
        <div className="absolute -top-1 -right-1">
          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-yellow-500 to-amber-600 border-0">
            <Crown className="h-3 w-3 text-white" />
          </Badge>
        </div>
      )}
    </div>
  );
};

export default AvatarWithFrame;
