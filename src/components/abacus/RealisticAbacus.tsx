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
      if (cols <= 5) return 68;
      if (cols <= 9) return 60;
      if (cols <= 13) return 54;
      return 46;
    }
    if (deviceType === 'tablet') {
      if (cols <= 5) return 82;
      if (cols <= 9) return 74;
      if (cols <= 13) return 66;
      return 58;
    }
    if (cols <= 5) return 108;
    if (cols <= 9) return 96;
    if (cols <= 13) return 86;
    return 76;
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
    if (cols <= 5) return 16;
    if (cols <= 9) return 12;
    if (cols <= 13) return 8;
    return 4;
  };
  
  const isVertical = orientation === 'vertical';
  
  // Frame colors — dark wood matching reference
  const frameBackground = colorPalette.frame || 'linear-gradient(145deg, #1A0F08 0%, #2C1D12 20%, #1A0F08 50%, #0D0704 100%)';
  
  return (
    <div className={cn(
      "flex items-center w-full",
      isVertical ? "flex-row justify-center overflow-y-auto" : "flex-col overflow-x-auto px-2 sm:px-4 lg:px-6"
    )}>
      {/* === OUTER FRAME — thick dark wooden frame === */}
      <motion.div 
        className="relative overflow-hidden w-full"
        style={{
          background: frameBackground,
          padding: compact ? '16px 24px' : '32px 48px',
          // Thick frame border matching reference
          border: `${compact ? 6 : 10}px solid #0D0704`,
          borderRadius: compact ? 12 : 18,
          boxShadow: `
            0 20px 60px -15px rgba(0,0,0,0.8),
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
            padding: compact ? '12px 28px' : '64px 68px',
            minHeight: compact ? 460 : 680,
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
      
      {/* Value display */}
      {showValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentState.value}
            initial={{ scale: 0.8, opacity: 0, y: -15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, type: 'spring' }}
            className="mt-3 sm:mt-4"
          >
            <div 
              className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #2C1D12, #1A0F08)',
                border: '2px solid #3D2B1F',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <span 
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider"
                style={{
                  color: '#F5E6D3',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
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
