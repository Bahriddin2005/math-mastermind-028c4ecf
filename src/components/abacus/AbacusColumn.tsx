import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { AbacusBead, BeadColorType } from './AbacusBead';
import { cn } from '@/lib/utils';

// Rainbow color sequence for lower beads
const RAINBOW_COLORS: BeadColorType[] = ['red', 'orange', 'yellow', 'cyan', 'blue', 'purple', 'pink'];

interface AbacusColumnProps {
  columnIndex: number;
  totalColumns: number;
  upperActive: boolean;
  lowerCount: number;
  onUpperChange: (active: boolean) => void;
  onLowerChange: (count: number) => void;
  beadSize?: number;
  showLabel?: boolean;
  disabled?: boolean;
  onBeadSound?: (isUpper: boolean) => void;
}

/**
 * Abakus ustuni - colorful style matching reference
 */
export const AbacusColumn = ({
  columnIndex,
  totalColumns,
  upperActive,
  lowerCount,
  onUpperChange,
  onLowerChange,
  beadSize = 40,
  showLabel = true,
  disabled = false,
  onBeadSound,
}: AbacusColumnProps) => {
  
  const getColumnLabel = () => {
    const labels = ['1', '10', '100', '1K', '10K', '100K'];
    return labels[columnIndex] || `10^${columnIndex}`;
  };
  
  // Get rainbow color based on column position
  const getLowerBeadColor = (): BeadColorType => {
    // Reverse index so rightmost column starts with first color
    const colorIndex = (totalColumns - 1 - columnIndex) % RAINBOW_COLORS.length;
    return RAINBOW_COLORS[colorIndex];
  };
  
  const handleUpperActivate = useCallback(() => {
    if (!upperActive) {
      onUpperChange(true);
      onBeadSound?.(true);
    }
  }, [upperActive, onUpperChange, onBeadSound]);
  
  const handleUpperDeactivate = useCallback(() => {
    if (upperActive) {
      onUpperChange(false);
      onBeadSound?.(true);
    }
  }, [upperActive, onUpperChange, onBeadSound]);
  
  const handleLowerActivate = useCallback((beadIndex: number) => {
    const newCount = Math.max(lowerCount, beadIndex + 1);
    if (newCount !== lowerCount) {
      onLowerChange(newCount);
      onBeadSound?.(false);
    }
  }, [lowerCount, onLowerChange, onBeadSound]);
  
  const handleLowerDeactivate = useCallback((beadIndex: number) => {
    const newCount = Math.min(lowerCount, beadIndex);
    if (newCount !== lowerCount) {
      onLowerChange(newCount);
      onBeadSound?.(false);
    }
  }, [lowerCount, onLowerChange, onBeadSound]);
  
  const columnValue = (upperActive ? 5 : 0) + lowerCount;
  const beadHeight = beadSize * 0.6;
  const lowerBeadColor = getLowerBeadColor();
  
  return (
    <div className="flex flex-col items-center relative">
      {/* Vertical rod */}
      <div 
        className="absolute z-0"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          bottom: 0,
          width: 4,
          background: 'linear-gradient(to bottom, #5C6B7A, #4A5568)',
          borderRadius: 2,
        }}
      />
      
      {/* Label */}
      {showLabel && (
        <div 
          className="text-center mb-1 z-10"
          style={{ minHeight: 16 }}
        >
          <div className="text-[10px] sm:text-xs font-bold text-slate-400">
            {getColumnLabel()}
          </div>
        </div>
      )}
      
      {/* Upper bead (value 5) - Green */}
      <div className="relative z-10 mb-0.5">
        <AbacusBead
          isUpper={true}
          isActive={upperActive}
          onActivate={handleUpperActivate}
          onDeactivate={handleUpperDeactivate}
          beadSize={beadSize}
          color="green"
          disabled={disabled}
        />
      </div>
      
      {/* Reckoning bar */}
      <div 
        className="relative z-20 w-full"
        style={{ 
          height: 6,
          marginTop: beadHeight * 0.3,
          marginBottom: beadHeight * 0.3,
        }}
      >
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: beadSize * 1.4,
            height: '100%',
            background: 'linear-gradient(to bottom, #E8E8E8, #D0D0D0)',
            borderRadius: 3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
      
      {/* Lower beads (4 beads, each value 1) - Rainbow colors */}
      <div className="relative z-10 flex flex-col items-center" style={{ gap: 2 }}>
        {[3, 2, 1, 0].map((visualIndex) => {
          const beadIndex = visualIndex;
          const isActive = beadIndex < lowerCount;
          
          return (
            <AbacusBead
              key={beadIndex}
              isUpper={false}
              isActive={isActive}
              onActivate={() => handleLowerActivate(beadIndex)}
              onDeactivate={() => handleLowerDeactivate(beadIndex)}
              beadSize={beadSize}
              color={lowerBeadColor}
              disabled={disabled}
            />
          );
        })}
      </div>
      
      {/* Column value indicator */}
      {showLabel && (
        <motion.div 
          className="mt-2 text-center z-10"
          key={columnValue}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <span className={cn(
            "inline-flex items-center justify-center",
            "min-w-[24px] h-6 px-2 rounded-md",
            "text-xs sm:text-sm font-bold",
            "bg-slate-700/50 text-slate-300",
            columnValue > 0 && "bg-primary/20 text-primary"
          )}>
            {columnValue}
          </span>
        </motion.div>
      )}
    </div>
  );
};
