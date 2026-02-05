import { useState, useCallback, memo } from 'react';
import { motion, PanInfo } from 'framer-motion';
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

/**
 * Optimized 3D Bead - fast and reliable
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
  
  const SNAP_THRESHOLD = beadSize * 0.25;
  const ACTIVE_OFFSET = beadSize * 0.4;
  
  const baseColor = customColor || '#FF6B6B';
  
  const handleDragStart = useCallback(() => {
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);
  
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    setIsDragging(false);
    const offset = info.offset.y;
    
    if (isUpper) {
      if (!isActive && offset > SNAP_THRESHOLD) {
        onActivate();
      } else if (isActive && offset < -SNAP_THRESHOLD) {
        onDeactivate();
      }
    } else {
      if (!isActive && offset < -SNAP_THRESHOLD) {
        onActivate();
      } else if (isActive && offset > SNAP_THRESHOLD) {
        onDeactivate();
      }
    }
  }, [disabled, isUpper, isActive, SNAP_THRESHOLD, onActivate, onDeactivate]);
  
  const getActiveOffset = useCallback(() => {
    if (isUpper) return isActive ? ACTIVE_OFFSET : 0;
    return isActive ? -ACTIVE_OFFSET * 0.6 : 0;
  }, [isUpper, isActive, ACTIVE_OFFSET]);

  const beadWidth = beadSize * 1.4;
  const beadHeight = beadSize * 0.9;
  
  // Pre-calculate colors once
  const adjustBrightness = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };
  
  const lighterColor = adjustBrightness(baseColor, 40);
  const darkerColor = adjustBrightness(baseColor, -30);
  const glowColor = adjustBrightness(baseColor, 20);
  const gradientId = `bead-${baseColor.replace('#', '')}-${isUpper ? 'u' : 'l'}-${Math.random().toString(36).slice(2, 6)}`;
  const shineId = `shine-${baseColor.replace('#', '')}-${isUpper ? 'u' : 'l'}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <motion.div
      className={cn(
        "relative cursor-pointer touch-none select-none will-change-transform",
        isDragging && "z-20",
        !disabled && "hover:brightness-110",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      style={{ 
        width: beadWidth, 
        height: beadHeight,
        filter: isDragging ? `drop-shadow(0 0 8px ${glowColor})` : 'none',
      }}
      drag={disabled ? false : "y"}
      dragConstraints={{ top: -beadSize, bottom: beadSize }}
      dragElastic={0.05}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={{ y: getActiveOffset() }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileTap={{ scale: 0.97 }}
    >
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lighterColor} />
            <stop offset="50%" stopColor={baseColor} />
            <stop offset="100%" stopColor={darkerColor} />
          </linearGradient>
          <radialGradient id={shineId} cx="30%" cy="20%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        <ellipse
          cx="50"
          cy="32"
          rx="45"
          ry="24"
          fill={`url(#${gradientId})`}
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}
        />
        
        <ellipse
          cx="35"
          cy="22"
          rx="18"
          ry="9"
          fill={`url(#${shineId})`}
        />
        
        <ellipse
          cx="50"
          cy="48"
          rx="28"
          ry="5"
          fill="white"
          opacity="0.12"
        />
        
        <ellipse
          cx="50"
          cy="30"
          rx="4"
          ry="4"
          fill={darkerColor}
        />
      </svg>
    </motion.div>
  );
});

AbacusBead.displayName = 'AbacusBead';