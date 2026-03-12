import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  
  // Bead sizes
  const getBeadSize = (cols: number): number => {
    if (deviceType === 'mobile') {
      if (cols <= 3) return 72;
      if (cols <= 5) return 60;
      if (cols <= 7) return 50;
      if (cols <= 10) return 42;
      return 36;
    }
    if (deviceType === 'tablet') {
      if (cols <= 3) return 86;
      if (cols <= 5) return 74;
      if (cols <= 7) return 64;
      if (cols <= 10) return 56;
      return 48;
    }
    if (cols <= 3) return 104;
    if (cols <= 5) return 90;
    if (cols <= 7) return 78;
    if (cols <= 10) return 68;
    return 58;
  };
  
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
    if (cols <= 3) return 18;
    if (cols <= 5) return 14;
    if (cols <= 7) return 10;
    if (cols <= 10) return 6;
    return 4;
  };
  
  const isVertical = orientation === 'vertical';
  const frameBackground = colorPalette.frame || 'linear-gradient(145deg, #1A0F08 0%, #2C1D12 20%, #1A0F08 50%, #0D0704 100%)';
  
  return (
    <div className={cn(
      "flex items-center w-full",
      isVertical ? "flex-row justify-center overflow-y-auto" : "flex-col overflow-x-auto px-2 sm:px-4 lg:px-6"
    )}>
      <motion.div 
        className="relative overflow-hidden w-full"
        style={{
          background: frameBackground,
          padding: compact ? '16px 20px' : '24px 32px',
          border: `${compact ? 6 : 8}px solid #0D0704`,
          borderRadius: compact ? 12 : 16,
          boxShadow: `
            0 16px 48px -12px rgba(0,0,0,0.7),
            inset 0 2px 4px rgba(255,255,255,0.03),
            inset 0 -2px 4px rgba(0,0,0,0.3),
            0 0 0 ${compact ? 2 : 3}px #3D2B1F
          `,
          transform: isVertical ? 'rotate(90deg)' : 'none',
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)`,
          }}
        />
        
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: 'inherit', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
        />
        
        <div 
          className="relative flex justify-center items-center w-full"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '6px 12px' : '20px 24px',
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