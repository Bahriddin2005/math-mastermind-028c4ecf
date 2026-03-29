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
      if (cols <= 3) return 146;
      if (cols <= 5) return 126;
      if (cols <= 7) return 108;
      if (cols <= 10) return 90;
      return 74;
    }
    if (deviceType === 'tablet') {
      if (cols <= 3) return 72;
      if (cols <= 5) return 62;
      if (cols <= 7) return 52;
      if (cols <= 10) return 44;
      return 36;
    }
    if (cols <= 3) return 100;
    if (cols <= 5) return 88;
    if (cols <= 7) return 76;
    if (cols <= 10) return 66;
    return 56;
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
    if (deviceType === 'mobile') {
      if (cols <= 3) return 12;
      if (cols <= 5) return 8;
      if (cols <= 7) return 5;
      if (cols <= 10) return 3;
      return 2;
    }
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
  const framePaddingX = deviceType === 'mobile' ? (compact ? 16 : 24) : (compact ? 36 : 56);
  const borderWidth = deviceType === 'mobile' ? (compact ? 6 : 8) : (compact ? 10 : 14);
  const extraFrame = deviceType === 'mobile' ? 2 : (compact ? 3 : 4);
  const frameWidth = totalColumnWidth + framePaddingX * 2 + (borderWidth + extraFrame) * 2;
  
  // Estimate frame height from minHeight + padding + borders
  const innerMinHeight = compact ? 1050 : 1400;
  const framePaddingY = deviceType === 'mobile' ? (compact ? 10 : 14) : (compact ? 18 : 24);
  const frameHeight = innerMinHeight + (compact ? 8 : 16) * 2 + framePaddingY * 2 + (borderWidth + extraFrame) * 2;
  
  // Auto-scale to fit viewport — fill as much space as possible
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 9999;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 9999;
  
  let scaleFactor = 1;
  if (isVertical && deviceType === 'mobile') {
    // After 90deg rotation: frameWidth → visual height, frameHeight → visual width
    const availH = screenH - 160;
    const availW = screenW - 16;
    scaleFactor = Math.min(availW / frameHeight, availH / frameWidth, 1);
  } else {
    // Horizontal: scale UP to fill available width
    const availW = screenW - 12;
    scaleFactor = availW / frameWidth;
    // Also check height so it doesn't overflow vertically
    const availH = screenH - (deviceType === 'mobile' ? 180 : 260);
    const heightScale = availH / frameHeight;
    scaleFactor = Math.min(scaleFactor, heightScale);
    // Cap at reasonable max
    scaleFactor = Math.min(scaleFactor, deviceType === 'mobile' ? 2.2 : 1.5);
  }
  
  return (
    <div className={cn(
      "flex items-center justify-center w-full",
      isVertical ? "flex-row" : "flex-col px-1 sm:px-4 lg:px-6"
    )}
    style={isVertical && deviceType === 'mobile' ? { 
      height: `${frameWidth * scaleFactor + 20}px`,
      overflow: 'hidden',
    } : undefined}
    >
      {/* === OUTER FRAME — carved rosewood frame === */}
      <motion.div 
        className="relative overflow-visible"
        style={{
          width: frameWidth,
          background: frameBackground,
          transform: `${isVertical ? 'rotate(90deg) ' : ''}scale(${scaleFactor})`,
          transformOrigin: 'center center',
          padding: deviceType === 'mobile' ? (compact ? '10px 12px' : '14px 16px') : (compact ? '18px 24px' : '24px 36px'),
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
        }}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: scaleFactor, y: 0 }}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        {/* Wood grain texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(2deg, transparent, transparent 6px, rgba(255,200,140,0.12) 6px, rgba(255,200,140,0.12) 7px),
              repeating-linear-gradient(178deg, transparent, transparent 11px, rgba(0,0,0,0.08) 11px, rgba(0,0,0,0.08) 12px)
            `,
            borderRadius: 'inherit',
          }}
        />
        
        {/* Corner ornaments — top-left */}
        <div className="absolute pointer-events-none" style={{ top: 6, left: 6, width: 28, height: 28 }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 26C2 14 14 2 26 2" stroke="rgba(218,180,130,0.25)" strokeWidth="1.5" fill="none"/>
            <path d="M6 26C6 16 16 6 26 6" stroke="rgba(218,180,130,0.15)" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="4" r="2" fill="rgba(218,180,130,0.2)"/>
          </svg>
        </div>
        {/* Corner ornaments — top-right */}
        <div className="absolute pointer-events-none" style={{ top: 6, right: 6, width: 28, height: 28, transform: 'scaleX(-1)' }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 26C2 14 14 2 26 2" stroke="rgba(218,180,130,0.25)" strokeWidth="1.5" fill="none"/>
            <path d="M6 26C6 16 16 6 26 6" stroke="rgba(218,180,130,0.15)" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="4" r="2" fill="rgba(218,180,130,0.2)"/>
          </svg>
        </div>
        {/* Corner ornaments — bottom-left */}
        <div className="absolute pointer-events-none" style={{ bottom: 6, left: 6, width: 28, height: 28, transform: 'scaleY(-1)' }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 26C2 14 14 2 26 2" stroke="rgba(218,180,130,0.25)" strokeWidth="1.5" fill="none"/>
            <path d="M6 26C6 16 16 6 26 6" stroke="rgba(218,180,130,0.15)" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="4" r="2" fill="rgba(218,180,130,0.2)"/>
          </svg>
        </div>
        {/* Corner ornaments — bottom-right */}
        <div className="absolute pointer-events-none" style={{ bottom: 6, right: 6, width: 28, height: 28, transform: 'scale(-1)' }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 26C2 14 14 2 26 2" stroke="rgba(218,180,130,0.25)" strokeWidth="1.5" fill="none"/>
            <path d="M6 26C6 16 16 6 26 6" stroke="rgba(218,180,130,0.15)" strokeWidth="1" fill="none"/>
            <circle cx="4" cy="4" r="2" fill="rgba(218,180,130,0.2)"/>
          </svg>
        </div>
        
        {/* Top & bottom carved border lines */}
        <div className="absolute left-8 right-8 pointer-events-none" style={{ top: 4, height: 2, background: 'linear-gradient(90deg, transparent, rgba(218,180,130,0.15) 20%, rgba(218,180,130,0.25) 50%, rgba(218,180,130,0.15) 80%, transparent)', borderRadius: 1 }} />
        <div className="absolute left-8 right-8 pointer-events-none" style={{ bottom: 4, height: 2, background: 'linear-gradient(90deg, transparent, rgba(218,180,130,0.15) 20%, rgba(218,180,130,0.25) 50%, rgba(218,180,130,0.15) 80%, transparent)', borderRadius: 1 }} />
        
        {/* Left & right carved border lines */}
        <div className="absolute top-8 bottom-8 pointer-events-none" style={{ left: 4, width: 2, background: 'linear-gradient(180deg, transparent, rgba(218,180,130,0.15) 20%, rgba(218,180,130,0.25) 50%, rgba(218,180,130,0.15) 80%, transparent)', borderRadius: 1 }} />
        <div className="absolute top-8 bottom-8 pointer-events-none" style={{ right: 4, width: 2, background: 'linear-gradient(180deg, transparent, rgba(218,180,130,0.15) 20%, rgba(218,180,130,0.25) 50%, rgba(218,180,130,0.15) 80%, transparent)', borderRadius: 1 }} />
        
        {/* Inner frame bevel highlight */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            boxShadow: 'inset 0 2px 0 rgba(255,220,180,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
          }}
        />
        
        {/* Columns container */}
        <div 
          className="relative flex justify-center items-center w-full"
          style={{ 
            gap: getGap(columns),
            padding: compact ? '8px 12px' : '16px 20px',
            minHeight: compact ? 1050 : 1400,
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
