import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
  const { pullDistance, isRefreshing, progress, shouldRefresh } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  return (
    // ENTERPRISE: Minimal wrapper - allows natural document scroll
    <div className="relative" style={{ overflow: 'visible', minHeight: 'auto' }}>
      {/* Pull indicator - positioned fixed, won't affect layout */}
      <div 
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center transition-all duration-200 md:hidden pointer-events-none",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: Math.max(pullDistance - 40, 16),
          transform: `translateX(-50%) scale(${0.5 + progress * 0.5})`,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center transition-all duration-200",
          shouldRefresh && "bg-primary/10 border-primary/30",
          isRefreshing && "bg-primary/20"
        )}>
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-muted-foreground transition-all duration-200",
              shouldRefresh && "text-primary",
              isRefreshing && "animate-spin text-primary"
            )}
            style={{ 
              transform: `rotate(${progress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* ENTERPRISE: Content wrapper - NO transform when not pulling for smoother scroll */}
      <div 
        style={{ 
          // Only apply transform when actively pulling
          transform: pullDistance > 0 && !isRefreshing 
            ? `translateY(${pullDistance * 0.3}px)` 
            : 'none',
          // Smooth transition only when releasing
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
          // CRITICAL: Never restrict overflow
          overflow: 'visible',
          minHeight: 'auto'
        }}
      >
        {children}
      </div>
    </div>
  );
};
