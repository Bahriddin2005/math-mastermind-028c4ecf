import { useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { AbacusBead } from './AbacusBead';
import { cn } from '@/lib/utils';
import type { ColumnState } from '@/lib/abacusEngine';
import { columnDigit } from '@/lib/abacusEngine';

interface AbacusColumnProps {
  columnIndex: number;
  totalColumns: number;
  columnState: ColumnState;
  onUpperChange: (active: boolean) => void;
  onLowerChange: (count: number) => void;
  beadSize?: number;
  showLabel?: boolean;
  disabled?: boolean;
  onBeadSound?: (isUpper: boolean) => void;
  upperBeadColor?: string;
  lowerBeadColors?: string[];
  /** Show dot marker on 1s, 1000s, 1000000s rods */
  showUnitDot?: boolean;
}

const COLUMN_LABELS = ['1', '10', '100', '1K', '10K', '100K', '1M', '10M', '100M', '1B', '10B', '100B', '1T'];

// Unit marker positions (soroban convention: dots at 1s, 1000s, 1000000s)
const UNIT_DOT_POSITIONS = [0, 3, 6, 9, 12];

/**
 * Professional Soroban Column
 * Matches reference: vertical rod, upper deck (1 bead), reckoning bar, lower deck (4 beads)
 * Proportions match real soroban: upper deck ~1/3 height, lower deck ~2/3 height
 */
export const AbacusColumn = memo(({
  columnIndex,
  columnState,
  onUpperChange,
  onLowerChange,
  beadSize = 40,
  showLabel = true,
  disabled = false,
  onBeadSound,
  upperBeadColor,
  lowerBeadColors,
  showUnitDot = true,
}: AbacusColumnProps) => {
  const upperActive = columnState.upper === 1;
  const lowerCount = columnState.lower;
  
  const columnLabel = COLUMN_LABELS[columnIndex] || `10^${columnIndex}`;
  const lowerBeadColor = lowerBeadColors?.[0] || '#8B4513';
  const columnValue = columnDigit(columnState);
  const beadHeight = beadSize * 0.65;
  const isUnitDot = UNIT_DOT_POSITIONS.includes(columnIndex);
  
  // Upper bead handlers
  const handleUpperActivate = useCallback(() => {
    if (disabled || upperActive) return;
    onUpperChange(true);
    onBeadSound?.(true);
  }, [disabled, upperActive, onUpperChange, onBeadSound]);
  
  const handleUpperDeactivate = useCallback(() => {
    if (disabled || !upperActive) return;
    onUpperChange(false);
    onBeadSound?.(true);
  }, [disabled, upperActive, onUpperChange, onBeadSound]);

  const handleLowerActivate = useCallback((beadIndex: number) => {
    if (disabled) return;
    const newCount = Math.max(lowerCount, beadIndex + 1);
    if (newCount === lowerCount || newCount > 4) return;
    onLowerChange(newCount);
    onBeadSound?.(false);
  }, [disabled, lowerCount, onLowerChange, onBeadSound]);

  const handleLowerDeactivate = useCallback((beadIndex: number) => {
    if (disabled) return;
    const newCount = Math.min(lowerCount, beadIndex);
    if (newCount === lowerCount) return;
    onLowerChange(newCount);
    onBeadSound?.(false);
  }, [disabled, lowerCount, onLowerChange, onBeadSound]);

  // Rod width scales with bead size
  const rodWidth = Math.max(4, beadSize * 0.12);

  return (
    <div className="flex flex-col items-center relative" style={{ minWidth: beadSize * 1.8, padding: '0 1px' }}>
      {/* Vertical rod — extends through entire column */}
      <div 
        className="absolute z-0"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: 0,
          bottom: 0,
          width: rodWidth,
          background: `linear-gradient(to right, #B8A082, #D4C4A8, #C8B896, #B8A082)`,
          borderRadius: rodWidth / 2,
        }}
      />
      
      {/* Column label (place value) */}
      {showLabel && (
        <div className="text-center mb-0.5 z-20" style={{ minHeight: 18, marginTop: -22 }}>
          <div 
            className="px-1.5 py-0.5 rounded font-bold"
            style={{
              fontSize: beadSize > 30 ? 10 : 8,
              color: '#F5E6D3',
              background: 'linear-gradient(135deg, #3D2B1F, #2A1810)',
              minWidth: beadSize * 0.7,
              border: '1px solid rgba(245, 230, 211, 0.15)',
            }}
          >
            {columnLabel}
          </div>
        </div>
      )}
      
      {/* === UPPER DECK (Heaven) — 1 bead === */}
      <div className="relative z-10" style={{ height: beadHeight * 2.2 }}>
        <div style={{ marginTop: beadHeight * 0.3 }}>
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
      </div>
      
      {/* === RECKONING BAR (Counting bar) === */}
      <div
        className="relative z-20 w-full"
        style={{ height: Math.max(8, beadSize * 0.22), marginTop: 2, marginBottom: 2 }}
      >
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: beadSize * 2.2,
            height: '100%',
            background: 'linear-gradient(to bottom, #4A3728, #2C1D12, #1A0F08)',
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        />
        {/* Unit dot marker on bar */}
        {showUnitDot && isUnitDot && (
          <div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: Math.max(5, beadSize * 0.12),
              height: Math.max(5, beadSize * 0.12),
              background: 'radial-gradient(circle, #F5E6D3, #C8A882)',
              boxShadow: '0 0 2px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>
      
      {/* === LOWER DECK (Earth) — 4 beads === */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: beadSize * 0.15 }}>
        {[3, 2, 1, 0].map((beadIndex) => {
          const isActive = beadIndex < lowerCount;
          
          return (
            <div key={beadIndex} style={{ marginTop: beadIndex < 3 ? -beadSize * 0.28 : 0 }}>
              <AbacusBead
                isUpper={false}
                isActive={isActive}
                onActivate={() => handleLowerActivate(beadIndex)}
                onDeactivate={() => handleLowerDeactivate(beadIndex)}
                beadSize={beadSize}
                customColor={lowerBeadColor}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
      
      {/* Value indicator */}
      {showLabel && (
        <motion.div 
          className="mt-1.5 text-center z-10"
          key={columnValue}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <span className={cn(
            "inline-flex items-center justify-center",
            "min-w-[22px] h-5 px-1.5 rounded",
            "text-xs font-bold",
            columnValue > 0 
              ? "text-amber-100"
              : "text-amber-100/40"
          )}
          style={{
            background: columnValue > 0 
              ? 'linear-gradient(135deg, #5D3A1A, #3D2B1F)' 
              : 'linear-gradient(135deg, #2A1810, #1A0F08)',
            border: columnValue > 0 
              ? '1px solid rgba(245, 230, 211, 0.2)' 
              : '1px solid rgba(245, 230, 211, 0.05)',
          }}>
            {columnValue}
          </span>
        </motion.div>
      )}
    </div>
  );
});

AbacusColumn.displayName = 'AbacusColumn';
