import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AbacusColumn } from './AbacusColumn';
import { useSound } from '@/hooks/useSound';
import { useDeviceType } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { AbacusColorScheme } from './AbacusColorScheme';
import { getColorPaletteForScheme } from './AbacusColorScheme';
import {
  type AbacusState,
  stateFromValue,
  resetAbacus,
  setUpperBead,
  setLowerBeads,
  computeValue,
} from '@/lib/abacusEngine';

export type AbacusMode = 'beginner' | 'mental' | 'test';
export type AbacusTheme = 'classic' | 'modern' | 'kids';
export type AbacusOrientation = 'horizontal' | 'vertical';

interface RealisticAbacusProps {
  columns?: number;
  value?: number;
  onChange?: (value: number) => void;
  mode?: AbacusMode;
  readOnly?: boolean;
  compact?: boolean;
  theme?: AbacusTheme;
  showValue?: boolean;
  orientation?: AbacusOrientation;
  colorScheme?: AbacusColorScheme;
  onBeadSound?: (isUpper: boolean) => void;
}

/**
 * Professional Soroban Abacus Simulator
 * Uses abacusEngine as single source of truth.
 * UI never calculates values — engine does.
 */
export const RealisticAbacus = ({
  columns = 13,
  value: controlledValue,
  onChange,
  mode = 'beginner',
  readOnly = false,
  compact = false,
  showValue: showValueProp,
  orientation = 'horizontal',
  colorScheme = 'classic',
  onBeadSound: customBeadSound,
}: RealisticAbacusProps) => {
  const { playSound } = useSound();
  const deviceType = useDeviceType();
  
  const showValue = showValueProp ?? (mode === 'beginner');
  const colorPalette = useMemo(() => getColorPaletteForScheme(colorScheme), [colorScheme]);
  
  // Responsive bead size
  const getBeadSize = (cols: number): number => {
    if (deviceType === 'mobile') {
      if (cols <= 5) return 40;
      if (cols <= 9) return 34;
      if (cols <= 13) return 28;
      return 22;
    }
    if (deviceType === 'tablet') {
      if (cols <= 5) return 54;
      if (cols <= 9) return 46;
      if (cols <= 13) return 40;
      return 34;
    }
    if (cols <= 5) return 76;
    if (cols <= 9) return 66;
    if (cols <= 13) return 58;
    return 50;
  };
  
  // Engine state — single source of truth
  const [engineState, setEngineState] = useState<AbacusState>(() =>
    stateFromValue(controlledValue ?? 0, columns)
  );
  
  // Sync with controlled value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setEngineState(stateFromValue(controlledValue, columns));
    }
  }, [controlledValue, columns]);
  
  // Sync column count changes
  useEffect(() => {
    if (engineState.columns.length !== columns) {
      const currentValue = controlledValue ?? engineState.value;
      setEngineState(stateFromValue(currentValue, columns));
    }
  }, [columns]);
  
  // Get current state (controlled or internal)
  const currentState = controlledValue !== undefined
    ? stateFromValue(controlledValue, columns)
    : engineState;
  
  // Engine-validated upper bead change
  const handleUpperChange = useCallback((columnIndex: number, active: boolean) => {
    if (readOnly) return;
    
    const newState = setUpperBead(currentState, columnIndex, active);
    if (!newState) return; // Invalid move — rejected by engine
    
    if (controlledValue === undefined) {
      setEngineState(newState);
    }
    onChange?.(newState.value);
  }, [currentState, controlledValue, onChange, readOnly]);
  
  // Engine-validated lower bead change
  const handleLowerChange = useCallback((columnIndex: number, count: number) => {
    if (readOnly) return;
    
    // Clamp to valid range
    const clampedCount = Math.max(0, Math.min(4, count));
    const newState = setLowerBeads(currentState, columnIndex, clampedCount);
    if (!newState) return; // Invalid move — rejected by engine
    
    if (controlledValue === undefined) {
      setEngineState(newState);
    }
    onChange?.(newState.value);
  }, [currentState, controlledValue, onChange, readOnly]);
  
  const handleBeadSound = useCallback((isUpper: boolean) => {
    if (customBeadSound) {
      customBeadSound(isUpper);
    } else {
      playSound(isUpper ? 'beadHigh' : 'bead');
    }
  }, [playSound, customBeadSound]);
  
  const beadSize = compact ? Math.min(28, getBeadSize(columns)) : getBeadSize(columns);
  
  const getGap = (cols: number): number => {
    if (cols <= 5) return 12;
    if (cols <= 9) return 8;
    if (cols <= 13) return 6;
    return 4;
  };
  
  const isVertical = orientation === 'vertical';
  
  return (
    <div className={cn(
      "flex items-center w-full",
      isVertical ? "flex-row justify-center overflow-y-auto" : "flex-col overflow-x-auto px-4 sm:px-6 lg:px-8"
    )}>
      {/* Abacus frame */}
      <motion.div 
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: colorPalette.frame || 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          padding: compact ? 20 : 40,
          boxShadow: `
            0 25px 50px -12px rgba(0,0,0,0.7),
            0 0 0 4px rgba(255,255,255,0.05),
            inset 0 2px 4px rgba(255,255,255,0.1)
          `,
          border: '6px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          transform: isVertical ? 'rotate(90deg)' : 'none',
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Inner frame gradient */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
          }}
        />
        
        {/* Columns container */}
        <div 
          className="relative flex justify-center items-stretch"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '16px 24px' : '28px 48px',
          }}
        >
          {/* Columns in reverse order (largest place value on left) */}
          {[...Array(columns)].map((_, i) => {
            const columnIndex = columns - 1 - i;
            const col = currentState.columns[columnIndex] || { upper: 0, lower: 0 };
            
            return (
              <AbacusColumn
                key={columnIndex}
                columnIndex={columnIndex}
                totalColumns={columns}
                columnState={col}
                onUpperChange={(active) => handleUpperChange(columnIndex, active)}
                onLowerChange={(count) => handleLowerChange(columnIndex, count)}
                beadSize={beadSize}
                showLabel={mode === 'beginner'}
                disabled={readOnly}
                onBeadSound={handleBeadSound}
                upperBeadColor={colorPalette.upperBead}
                lowerBeadColors={colorPalette.lowerBeads}
              />
            );
          })}
        </div>
        
        {/* Frame corner decorations */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-lg" />
      </motion.div>
      
      {/* Value display */}
      {showValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentState.value}
            initial={{ scale: 0.8, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: 'spring' }}
            className="mt-4 sm:mt-5"
          >
            <div className={cn(
              "px-6 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl",
              "bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20",
              "backdrop-blur-sm",
              "border-2 border-primary/40",
              "shadow-lg shadow-primary/20"
            )}>
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {currentState.value.toLocaleString()}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default RealisticAbacus;
