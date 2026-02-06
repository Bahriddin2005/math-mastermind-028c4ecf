import { useState, useCallback, useRef, memo, useMemo } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
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

// Minimum drag distance before bead starts responding (prevents accidental touch)
const DRAG_INTENT_THRESHOLD = 12;

/**
 * Ultra-Realistic Soroban Bead — Drag-Only Interaction
 * 
 * NO click/tap movement. Beads move ONLY via intentional vertical drag.
 * Physics-like: heavy, controlled, mechanical, precise.
 * Snap-to-position: only two valid states (active/inactive), no floating.
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
  const [isDragging, setIsDragging] = useState(false);
  const intentConfirmed = useRef(false);
  const dragAccumulator = useRef(0);

  const ACTIVE_OFFSET = beadSize * 0.45;

  const baseColor = customColor || '#8B4513';

  // Drag start — reset intent tracking
  const handleDragStart = useCallback(() => {
    if (disabled) return;
    intentConfirmed.current = false;
    dragAccumulator.current = 0;
  }, [disabled]);

  // During drag — only show visual feedback after threshold
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    
    const totalDrag = Math.abs(info.offset.y);
    
    if (!intentConfirmed.current && totalDrag >= DRAG_INTENT_THRESHOLD) {
      intentConfirmed.current = true;
      setIsDragging(true);
    }
  }, [disabled]);

  // Drag end — determine final state based on drag direction
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    setIsDragging(false);
    
    // Only process if intent was confirmed (drag exceeded threshold)
    if (!intentConfirmed.current) return;
    
    const dy = info.offset.y;
    
    if (isUpper) {
      // Upper bead: drag DOWN to activate, drag UP to deactivate
      if (!isActive && dy > DRAG_INTENT_THRESHOLD) onActivate();
      else if (isActive && dy < -DRAG_INTENT_THRESHOLD) onDeactivate();
    } else {
      // Lower bead: drag UP to activate, drag DOWN to deactivate
      if (!isActive && dy < -DRAG_INTENT_THRESHOLD) onActivate();
      else if (isActive && dy > DRAG_INTENT_THRESHOLD) onDeactivate();
    }
    
    intentConfirmed.current = false;
  }, [disabled, isUpper, isActive, onActivate, onDeactivate]);

  // Snap position — only two valid states, no in-between
  const targetY = isUpper
    ? (isActive ? ACTIVE_OFFSET : 0)
    : (isActive ? -ACTIVE_OFFSET * 0.6 : 0);

  // Bead proportions
  const beadWidth = beadSize * 1.7;
  const beadHeight = beadSize * 1.1;

  const idRef = useRef(`bead-${++beadIdCounter}`);

  // Pre-compute wooden colors
  const colors = useMemo(() => {
    const highlight = adjustBrightness(baseColor, 50);
    const midLight = adjustBrightness(baseColor, 25);
    const dark = adjustBrightness(baseColor, -35);
    const darkest = adjustBrightness(baseColor, -50);
    const rim = adjustBrightness(baseColor, -20);
    return { highlight, midLight, dark, darkest, rim };
  }, [baseColor]);

  const gradId = `${idRef.current}-g`;
  const shineId = `${idRef.current}-s`;
  const grooveId = `${idRef.current}-gr`;
  const shadowId = `${idRef.current}-sh`;

  return (
    <motion.div
      className={cn(
        "relative touch-none select-none will-change-transform",
        isDragging && "z-20",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-grab",
        isDragging && !disabled && "cursor-grabbing"
      )}
      style={{
        width: beadWidth,
        height: beadHeight,
        filter: isDragging
          ? 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
          : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
      }}
      onPointerDownCapture={(e) => {
        // CRITICAL: Stop event from reaching other beads
        e.stopPropagation();
      }}
      drag={disabled ? false : "y"}
      dragConstraints={{ top: -beadSize * 0.55, bottom: beadSize * 0.55 }}
      dragElastic={0}
      dragMomentum={false}
      dragSnapToOrigin
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      // NO onTap — beads do NOT respond to click/tap
      animate={{ y: targetY }}
      transition={{
        type: 'tween',
        duration: 0.15,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox="0 0 120 65"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          {/* Main wooden gradient — top lit, bottom shadowed */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="15%" stopColor={colors.midLight} />
            <stop offset="40%" stopColor={baseColor} />
            <stop offset="70%" stopColor={colors.dark} />
            <stop offset="100%" stopColor={colors.darkest} />
          </linearGradient>

          {/* Top shine reflection */}
          <radialGradient id={shineId} cx="35%" cy="15%" r="40%" fx="35%" fy="12%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="60%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Horizontal groove lines (wood grain) */}
          <pattern id={grooveId} x="0" y="0" width="120" height="6" patternUnits="userSpaceOnUse">
            <line x1="10" y1="3" x2="110" y2="3" stroke={colors.dark} strokeWidth="0.5" strokeOpacity="0.2" />
          </pattern>

          {/* Bottom shadow ellipse */}
          <radialGradient id={shadowId} cx="50%" cy="80%" r="50%">
            <stop offset="0%" stopColor={colors.darkest} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.darkest} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Drop shadow underneath bead */}
        <ellipse cx="60" cy="56" rx="42" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* Main bead body */}
        <ellipse cx="60" cy="33" rx="52" ry="26" fill={`url(#${gradId})`} />

        {/* Wood grain texture overlay */}
        <ellipse cx="60" cy="33" rx="52" ry="26" fill={`url(#${grooveId})`} opacity="0.3" />

        {/* Top rim highlight */}
        <ellipse cx="60" cy="12" rx="40" ry="8" fill={`url(#${shineId})`} />

        {/* Left edge highlight */}
        <ellipse cx="18" cy="30" rx="6" ry="14" fill="white" opacity="0.06" />

        {/* Bottom rim subtle reflection */}
        <ellipse cx="60" cy="52" rx="30" ry="5" fill="white" opacity="0.08" />

        {/* Rod hole — center dark circle */}
        <ellipse cx="60" cy="33" rx="5" ry="5" fill={colors.darkest} opacity="0.7" />
        <ellipse cx="59" cy="32" rx="3" ry="3" fill={colors.dark} opacity="0.5" />
      </svg>
    </motion.div>
  );
});

AbacusBead.displayName = 'AbacusBead';
