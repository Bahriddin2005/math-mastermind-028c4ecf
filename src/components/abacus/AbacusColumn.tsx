import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AbacusBead } from './AbacusBead';
import { cn } from '@/lib/utils';

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
  // Custom colors from color scheme
  upperBeadColor?: string;
  lowerBeadColors?: string[];
}

/**
 * Abakus ustuni - customizable color style
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
  upperBeadColor,
  lowerBeadColors,
}: AbacusColumnProps) => {
  // Each lower bead can be moved independently (UI state). We still report the
  // digit as a count to the parent.
  const [lowerActive, setLowerActive] = useState<boolean[]>(() =>
    Array.from({ length: 4 }, (_, i) => i < lowerCount)
  );

  // Sync local bead positions when parent changes value (reset/controlled).
  useEffect(() => {
    setLowerActive((prev) => {
      const prevCount = prev.filter(Boolean).length;
      if (prevCount === lowerCount) return prev;
      return Array.from({ length: 4 }, (_, i) => i < lowerCount);
    });
  }, [lowerCount]);

  const lowerActiveCount = useMemo(() => lowerActive.filter(Boolean).length, [lowerActive]);
  
  const getColumnLabel = () => {
    const labels = ['1', '10', '100', '1K', '10K', '100K', '1M', '10M', '100M', '1B', '10B', '100B', '1T', '10T', '100T', '1000T', '10000T'];
    return labels[columnIndex] || `10^${columnIndex}`;
  };
  
  // Get color for lower bead based on row index
  const getLowerBeadColor = (rowIndex: number): string => {
    if (lowerBeadColors && lowerBeadColors[rowIndex]) {
      return lowerBeadColors[rowIndex];
    }
    // Fallback to default colors
    const defaultColors = ['#EF5350', '#FFA726', '#FFEE58', '#26C6DA'];
    return defaultColors[rowIndex] || '#26C6DA';
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
    if (disabled) return;
    if (lowerActive[beadIndex]) return;

    const next = [...lowerActive];
    next[beadIndex] = true;
    setLowerActive(next);
    onLowerChange(next.filter(Boolean).length);
    onBeadSound?.(false);
  }, [disabled, lowerActive, onBeadSound, onLowerChange]);

  const handleLowerDeactivate = useCallback((beadIndex: number) => {
    if (disabled) return;
    if (!lowerActive[beadIndex]) return;

    const next = [...lowerActive];
    next[beadIndex] = false;
    setLowerActive(next);
    onLowerChange(next.filter(Boolean).length);
    onBeadSound?.(false);
  }, [disabled, lowerActive, onBeadSound, onLowerChange]);

  const columnValue = (upperActive ? 5 : 0) + lowerActiveCount;
  const beadHeight = beadSize * 0.7;
  
  return (
    <div className="flex flex-col items-center relative" style={{ minWidth: beadSize * 1.7, padding: '0 2px' }}>
      {/* Vertical rod - sleek dark design */}
      <div 
        className="absolute z-0"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          bottom: 0,
          width: 8,
          background: 'linear-gradient(to right, #2C3E50, #34495E, #2C3E50)',
          borderRadius: 4,
          boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3), inset 2px 0 4px rgba(255,255,255,0.1)',
        }}
      />
      
      {/* Label - tepada, ko'zga tashlanadigan */}
      {showLabel && (
        <div 
          className="text-center mb-2 z-20"
          style={{ minHeight: 20 }}
        >
          <div 
            className="px-1.5 py-0.5 rounded-md font-bold"
            style={{
              fontSize: beadSize > 30 ? 11 : 9,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
              minWidth: beadSize * 0.8,
            }}
          >
            {getColumnLabel()}
          </div>
        </div>
      )}
      
      {/* Upper bead (value 5) - positioned closer to reckoning bar */}
      <div className="relative z-10" style={{ marginTop: 0 }}>
        <AbacusBead
          isUpper={true}
          isActive={upperActive}
          onActivate={handleUpperActivate}
          onDeactivate={handleUpperDeactivate}
          beadSize={beadSize}
          customColor={upperBeadColor}
          disabled={disabled}
        />
      </div>
      
      {/* Reckoning bar - modern sleek design */}
      <div
        className="relative z-20 w-full"
        style={{ 
          height: 14,
          marginTop: beadHeight * 0.2,
          marginBottom: beadHeight * 0.2,
        }}
      >
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: beadSize * 1.8,
            height: '100%',
            background: 'linear-gradient(to bottom, #5D6D7E, #2C3E50, #1A252F)',
            borderRadius: 4,
            boxShadow: '0 3px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        />
        {/* Dots on the bar */}
        <div 
          className="absolute left-1/4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #F39C12, #D68910)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
        <div 
          className="absolute right-1/4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #F39C12, #D68910)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      </div>
      
      {/* Lower beads (4 beads) */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: beadSize * 0.4 }}>
        {[3, 2, 1, 0].map((visualIndex) => {
          const beadIndex = visualIndex;
          const isActive = Boolean(lowerActive[beadIndex]);
          const rowIndex = 3 - visualIndex;
          
          return (
            <div 
              key={beadIndex} 
              style={{ marginTop: visualIndex < 3 ? -beadSize * 0.15 : 0 }}
            >
              <AbacusBead
                isUpper={false}
                isActive={isActive}
                onActivate={() => handleLowerActivate(beadIndex)}
                onDeactivate={() => handleLowerDeactivate(beadIndex)}
                beadSize={beadSize}
                customColor={getLowerBeadColor(rowIndex)}
                disabled={disabled}
              />
            </div>
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
