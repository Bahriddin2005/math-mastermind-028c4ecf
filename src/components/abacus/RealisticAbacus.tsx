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
  setUpperBead,
  setLowerBeads,
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
 * Professional Soroban Abacus — Reference-Accurate Design
 * 
 * Matches real soroban: dark wooden frame, natural beads, proper proportions.
 * Upper deck ~1/3, lower deck ~2/3.
 * Engine-backed: zero desync possible.
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
  
  // Responsive bead size — large enough to interact comfortably
  const getBeadSize = (cols: number): number => {
    if (deviceType === 'mobile') {
      if (cols <= 3) return 52;
      if (cols <= 5) return 46;
      if (cols <= 7) return 38;
      if (cols <= 10) return 32;
      return 26;
    }
    if (deviceType === 'tablet') {
      if (cols <= 3) return 64;
      if (cols <= 5) return 56;
      if (cols <= 7) return 48;
      if (cols <= 10) return 42;
      return 36;
    }
    if (cols <= 3) return 82;
    if (cols <= 5) return 72;
    if (cols <= 7) return 62;
    if (cols <= 10) return 54;
    return 46;
  };
  
  // Engine state
  const [engineState, setEngineState] = useState<AbacusState>(() =>
    stateFromValue(controlledValue ?? 0, columns)
  );
  
  useEffect(() => {
    if (controlledValue !== undefined) {
      setEngineState(stateFromValue(controlledValue, columns));
    }
  }, [controlledValue, columns]);
  
  useEffect(() => {
    if (engineState.columns.length !== columns) {
      setEngineState(stateFromValue(controlledValue ?? engineState.value, columns));
    }
  }, [columns]);
  
  const currentState = controlledValue !== undefined
    ? stateFromValue(controlledValue, columns)
    : engineState;
  
  const handleUpperChange = useCallback((columnIndex: number, active: boolean) => {
    if (readOnly) return;
    const newState = setUpperBead(currentState, columnIndex, active);
    if (!newState) return;
    if (controlledValue === undefined) setEngineState(newState);
    onChange?.(newState.value);
  }, [currentState, controlledValue, onChange, readOnly]);
  
  const handleLowerChange = useCallback((columnIndex: number, count: number) => {
    if (readOnly) return;
    const clampedCount = Math.max(0, Math.min(4, count));
    const newState = setLowerBeads(currentState, columnIndex, clampedCount);
    if (!newState) return;
    if (controlledValue === undefined) setEngineState(newState);
    onChange?.(newState.value);
  }, [currentState, controlledValue, onChange, readOnly]);
  
  const handleBeadSound = useCallback((isUpper: boolean) => {
    if (customBeadSound) {
      customBeadSound(isUpper);
    } else {
      playSound(isUpper ? 'beadHigh' : 'bead');
    }
  }, [playSound, customBeadSound]);
  
  const beadSize = compact ? Math.min(26, getBeadSize(columns)) : getBeadSize(columns);
  
  const getGap = (cols: number): number => {
    if (cols <= 3) return 20;
    if (cols <= 5) return 14;
    if (cols <= 7) return 10;
    if (cols <= 10) return 6;
    return 4;
  };
  
  const isVertical = orientation === 'vertical';
  
  // Frame colors — premium rosewood with carved patterns
  const frameBackground = 'linear-gradient(145deg, #2A1508 0%, #3D2010 15%, #4A2814 30%, #3D2010 50%, #2A1508 70%, #1A0D06 100%)';
  
  // Calculate frame width based on columns + bead size + gaps
  const gap = getGap(columns);
  const columnMinWidth = beadSize * 1.8;
  const totalColumnWidth = columns * columnMinWidth + (columns - 1) * gap;
  const framePaddingX = compact ? 36 : 56;
  const borderWidth = compact ? 10 : 14;
  const extraFrame = compact ? 3 : 4;
  const frameWidth = totalColumnWidth + framePaddingX * 2 + (borderWidth + extraFrame) * 2;
  
  return (
    <div className={cn(
      "flex items-center justify-center w-full",
      isVertical ? "flex-row overflow-y-auto" : "flex-col overflow-x-auto px-2 sm:px-4 lg:px-6"
    )}>
      {/* === OUTER FRAME — carved rosewood frame === */}
      <motion.div 
        className="relative overflow-visible"
        style={{
          width: frameWidth,
          maxWidth: 'calc(100vw - 24px)',
          background: frameBackground,
          padding: compact ? '18px 24px' : '24px 36px',
          border: `${borderWidth}px solid #1A0D06`,
          borderRadius: compact ? 16 : 22,
          boxShadow: `
            0 25px 70px -15px rgba(0,0,0,0.85),
            0 8px 25px -5px rgba(0,0,0,0.5),
            inset 0 2px 6px rgba(255,220,180,0.06),
            inset 0 -3px 8px rgba(0,0,0,0.4),
            0 0 0 ${extraFrame}px #5A3D28,
            0 0 0 ${extraFrame + 1}px #1A0D06,
            0 0 0 ${extraFrame + 3}px #3D2818
          `,
          transform: isVertical ? 'rotate(90deg)' : 'none',
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        {/* Wood grain texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 8px,
              rgba(255,255,255,0.1) 8px,
              rgba(255,255,255,0.1) 9px
            )`,
          }}
        />
        
        {/* Inner frame edge highlight */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        />
        
        {/* Columns container */}
        <div 
          className="relative flex justify-center items-center w-full"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '8px 12px' : '16px 20px',
            minHeight: compact ? 280 : 380,
          }}
        >
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
      </motion.div>
      
    </div>
  );
};

export default RealisticAbacus;
