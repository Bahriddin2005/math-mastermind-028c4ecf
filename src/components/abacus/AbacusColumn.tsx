import { useCallback, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { AbacusBead } from './AbacusBead';
import { cn } from '@/lib/utils';
import type { ColumnState } from '@/lib/abacusEngine';
import { isValidColumn, columnDigit } from '@/lib/abacusEngine';

interface AbacusColumnProps {
  columnIndex: number;
  totalColumns: number;
  /** Engine-controlled column state */
  columnState: ColumnState;
  onUpperChange: (active: boolean) => void;
  onLowerChange: (count: number) => void;
  beadSize?: number;
  showLabel?: boolean;
  disabled?: boolean;
  onBeadSound?: (isUpper: boolean) => void;
  upperBeadColor?: string;
  lowerBeadColors?: string[];
}

const COLUMN_LABELS = ['1', '10', '100', '1K', '10K', '100K', '1M', '10M', '100M', '1B', '10B', '100B', '1T'];

/**
 * Professional Soroban Column
 * - Reads state from engine (ColumnState) — never computes internally
 * - All user actions dispatch to parent, which validates via engine
 * - Visual state always matches logical state
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
}: AbacusColumnProps) => {
  const upperActive = columnState.upper === 1;
  const lowerCount = columnState.lower;
  
  const columnLabel = COLUMN_LABELS[columnIndex] || `10^${columnIndex}`;
  const lowerBeadColor = lowerBeadColors?.[0] || '#A0522D';
  const columnValue = columnDigit(columnState);
  const beadHeight = beadSize * 0.7;
  
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

  // Lower bead handlers — each bead activates/deactivates independently
  const handleLowerActivate = useCallback((beadIndex: number) => {
    if (disabled) return;
    // Activating bead N means at least N+1 beads are active
    const newCount = Math.max(lowerCount, beadIndex + 1);
    if (newCount === lowerCount) return;
    if (newCount > 4) return; // Safety: never exceed 4
    onLowerChange(newCount);
    onBeadSound?.(false);
  }, [disabled, lowerCount, onLowerChange, onBeadSound]);

  const handleLowerDeactivate = useCallback((beadIndex: number) => {
    if (disabled) return;
    // Deactivating bead N means at most N beads are active
    const newCount = Math.min(lowerCount, beadIndex);
    if (newCount === lowerCount) return;
    onLowerChange(newCount);
    onBeadSound?.(false);
  }, [disabled, lowerCount, onLowerChange, onBeadSound]);

  return (
    <div className="flex flex-col items-center relative" style={{ minWidth: beadSize * 1.7, padding: '0 2px' }}>
      {/* Rod */}
      <div 
        className="absolute z-0"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: -10,
          bottom: 0,
          width: 8,
          background: 'linear-gradient(to right, #475569, #64748B, #475569)',
          borderRadius: 4,
        }}
      >
        <div 
          className="absolute -top-1 left-1/2 -translate-x-1/2"
          style={{
            width: 14,
            height: 14,
            background: 'radial-gradient(circle at 40% 40%, #94A3B8, #475569)',
            borderRadius: '50%',
          }}
        />
      </div>
      
      {/* Label */}
      {showLabel && (
        <div className="text-center mb-1 z-20" style={{ minHeight: 20, marginTop: -25 }}>
          <div 
            className="px-1.5 py-0.5 rounded-md font-bold text-white"
            style={{
              fontSize: beadSize > 30 ? 11 : 9,
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              minWidth: beadSize * 0.8,
            }}
          >
            {columnLabel}
          </div>
        </div>
      )}
      
      {/* Upper bead */}
      <div className="relative z-10" style={{ marginTop: beadHeight * 0.2 }}>
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
      
      {/* Reckoning bar */}
      <div
        className="relative z-20 w-full"
        style={{ height: 12, marginTop: beadHeight * 1.4, marginBottom: beadHeight * 0.2 }}
      >
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: beadSize * 2,
            height: '100%',
            background: 'linear-gradient(to bottom, #64748B, #475569, #334155)',
            borderRadius: 2,
          }}
        />
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800" />
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-800" />
      </div>
      
      {/* Lower beads */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: beadSize * 1.2 }}>
        {[3, 2, 1, 0].map((visualIndex) => {
          const beadIndex = visualIndex;
          const isActive = beadIndex < lowerCount;
          
          return (
            <div key={beadIndex} style={{ marginTop: visualIndex < 3 ? -beadSize * 0.25 : 0 }}>
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
          className="mt-2 text-center z-10"
          key={columnValue}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <span className={cn(
            "inline-flex items-center justify-center",
            "min-w-[24px] h-6 px-2 rounded-md",
            "text-xs sm:text-sm font-bold",
            "bg-muted text-muted-foreground",
            columnValue > 0 && "bg-primary/20 text-primary"
          )}>
            {columnValue}
          </span>
        </motion.div>
      )}
    </div>
  );
});

AbacusColumn.displayName = 'AbacusColumn';
