import { useState, useCallback, useRef, memo, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type BeadSoundType = 'green' | 'red' | 'orange' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'pink';

interface AbacusBeadProps {
  isUpper: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  beadSize: number;
  customColor?: string;
  disabled?: boolean;
}

const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

let beadIdCounter = 0;

const DRAG_THRESHOLD = 10; // px before drag is recognized

/**
 * Ultra-Realistic Soroban Bead — Manual Pointer Drag
 * 
 * NO framer-motion drag (avoids animate conflict).
 * Uses raw pointer events for precise, individual control.
 * Each bead is fully independent — dragging one never affects another.
 */
export const AbacusBead = memo(({
  isUpper,
  isActive,
  onActivate,
  onDeactivate,
  beadSize,
  customColor,
  disabled = false,
}: AbacusBeadProps) => {
  const beadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // Live drag offset in px
  
  const pointerState = useRef({
    active: false,
    startY: 0,
    intentConfirmed: false,
    pointerId: -1,
  });

  const ACTIVE_OFFSET = beadSize * 0.45;
  const SNAP_DISTANCE = isUpper ? ACTIVE_OFFSET : ACTIVE_OFFSET * 1.8;
  
  const baseColor = customColor || '#8B4513';

  // Target position based on state
  const restY = isUpper
    ? (isActive ? SNAP_DISTANCE : 0)
    : (isActive ? -SNAP_DISTANCE : 0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    
    const el = beadRef.current;
    if (!el) return;
    
    el.setPointerCapture(e.pointerId);
    
    pointerState.current = {
      active: true,
      startY: e.clientY,
      intentConfirmed: false,
      pointerId: e.pointerId,
    };
  }, [disabled]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const state = pointerState.current;
    if (!state.active) return;
    
    const dy = e.clientY - state.startY;
    
    if (!state.intentConfirmed) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      state.intentConfirmed = true;
      setIsDragging(true);
    }
    
    // Clamp drag offset to reasonable range
    const maxDrag = SNAP_DISTANCE + beadSize * 0.3;
    const clampedDy = Math.max(-maxDrag, Math.min(maxDrag, dy));
    setDragOffset(clampedDy);
  }, [SNAP_DISTANCE, beadSize]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const state = pointerState.current;
    if (!state.active) return;
    
    const el = beadRef.current;
    if (el) el.releasePointerCapture(state.pointerId);
    
    state.active = false;
    setIsDragging(false);
    setDragOffset(0);
    
    if (!state.intentConfirmed) return;
    
    const dy = e.clientY - state.startY;
    
    if (isUpper) {
      if (!isActive && dy > DRAG_THRESHOLD) onActivate();
      else if (isActive && dy < -DRAG_THRESHOLD) onDeactivate();
    } else {
      if (!isActive && dy < -DRAG_THRESHOLD) onActivate();
      else if (isActive && dy > DRAG_THRESHOLD) onDeactivate();
    }
  }, [isUpper, isActive, onActivate, onDeactivate]);

  const handlePointerCancel = useCallback(() => {
    pointerState.current.active = false;
    setIsDragging(false);
    setDragOffset(0);
  }, []);

  // Bead proportions
  const beadWidth = beadSize * 1.7;
  const beadHeight = beadSize * 1.1;

  const idRef = useRef(`bead-${++beadIdCounter}`);

  const colors = useMemo(() => {
    const highlight = adjustBrightness(baseColor, 50);
    const midLight = adjustBrightness(baseColor, 25);
    const dark = adjustBrightness(baseColor, -35);
    const darkest = adjustBrightness(baseColor, -50);
    return { highlight, midLight, dark, darkest };
  }, [baseColor]);

  const gradId = `${idRef.current}-g`;
  const shineId = `${idRef.current}-s`;
  const grooveId = `${idRef.current}-gr`;

  // Final Y = rest position + live drag offset (only while dragging)
  const currentY = isDragging ? restY + dragOffset : restY;

  return (
    <div
      ref={beadRef}
      className={cn(
        "relative touch-none select-none",
        isDragging && "z-20",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-grab",
        isDragging && !disabled && "cursor-grabbing"
      )}
      style={{
        width: beadWidth,
        height: beadHeight,
        transform: `translateY(${currentY}px)`,
        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
        filter: isDragging
          ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox="0 0 120 65"
        preserveAspectRatio="none"
        className="absolute inset-0 pointer-events-none"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="15%" stopColor={colors.midLight} />
            <stop offset="40%" stopColor={baseColor} />
            <stop offset="70%" stopColor={colors.dark} />
            <stop offset="100%" stopColor={colors.darkest} />
          </linearGradient>
          <radialGradient id={shineId} cx="35%" cy="15%" r="40%" fx="35%" fy="12%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="60%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <pattern id={grooveId} x="0" y="0" width="120" height="6" patternUnits="userSpaceOnUse">
            <line x1="10" y1="3" x2="110" y2="3" stroke={colors.dark} strokeWidth="0.5" strokeOpacity="0.2" />
          </pattern>
        </defs>

        <ellipse cx="60" cy="56" rx="42" ry="6" fill="rgba(0,0,0,0.15)" />
        <ellipse cx="60" cy="33" rx="52" ry="26" fill={`url(#${gradId})`} />
        <ellipse cx="60" cy="33" rx="52" ry="26" fill={`url(#${grooveId})`} opacity="0.3" />
        <ellipse cx="60" cy="12" rx="40" ry="8" fill={`url(#${shineId})`} />
        <ellipse cx="18" cy="30" rx="6" ry="14" fill="white" opacity="0.06" />
        <ellipse cx="60" cy="52" rx="30" ry="5" fill="white" opacity="0.08" />
        <ellipse cx="60" cy="33" rx="5" ry="5" fill={colors.darkest} opacity="0.7" />
        <ellipse cx="59" cy="32" rx="3" ry="3" fill={colors.dark} opacity="0.5" />
      </svg>
    </div>
  );
});

AbacusBead.displayName = 'AbacusBead';
