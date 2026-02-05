import { useRef, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BeadColorType = 'green' | 'red' | 'orange' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'pink';

interface AbacusBeadProps {
  isUpper: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  beadSize: number;
  color?: BeadColorType;
  customColor?: string;
  disabled?: boolean;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}

/**
 * Hexagonal/Diamond bead matching reference image exactly
 */
export const AbacusBead = ({
  isUpper,
  isActive,
  onActivate,
  onDeactivate,
  beadSize,
  customColor,
  disabled = false,
  onMoveStart,
  onMoveEnd,
}: AbacusBeadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const beadRef = useRef<HTMLDivElement>(null);
  
  const SNAP_THRESHOLD = beadSize * 0.3;
  const ACTIVE_OFFSET = beadSize * 0.4;
  
  // Default color
  const baseColor = customColor || '#E74C3C';
  
  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
    onMoveStart?.();
  };
  
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    setIsDragging(false);
    const offset = info.offset.y;
    
    if (isUpper) {
      if (!isActive && offset > SNAP_THRESHOLD) onActivate();
      else if (isActive && offset < -SNAP_THRESHOLD) onDeactivate();
    } else {
      if (!isActive && offset < -SNAP_THRESHOLD) onActivate();
      else if (isActive && offset > SNAP_THRESHOLD) onDeactivate();
    }
    onMoveEnd?.();
  };
  
  const getActiveOffset = () => {
    if (isUpper) return isActive ? ACTIVE_OFFSET : 0;
    return isActive ? -ACTIVE_OFFSET * 0.6 : 0;
  };

  // Round bead dimensions
  const beadWidth = beadSize * 1.4;
  const beadHeight = beadSize * 0.9;

  return (
    <motion.div
      ref={beadRef}
      className={cn(
        "relative cursor-pointer touch-none select-none",
        isDragging && "z-20",
        !disabled && "hover:brightness-105 active:brightness-95",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      style={{ width: beadWidth, height: beadHeight }}
      drag={disabled ? false : "y"}
      dragConstraints={{ top: -beadSize, bottom: beadSize }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={{ y: getActiveOffset() }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* 3D Round Bead */}
      <div
        className="relative rounded-full"
        style={{
          width: beadWidth,
          height: beadHeight,
          background: `
            radial-gradient(ellipse 60% 40% at 30% 25%, rgba(255,255,255,0.8) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 50% 50%, ${baseColor} 0%, ${baseColor} 100%)
          `,
          boxShadow: `
            inset 0 -${beadHeight * 0.15}px ${beadHeight * 0.3}px rgba(0,0,0,0.4),
            inset 0 ${beadHeight * 0.1}px ${beadHeight * 0.2}px rgba(255,255,255,0.3),
            0 ${beadHeight * 0.15}px ${beadHeight * 0.25}px rgba(0,0,0,0.3),
            0 ${beadHeight * 0.05}px ${beadHeight * 0.1}px rgba(0,0,0,0.2)
          `,
          border: `1px solid rgba(0,0,0,0.15)`,
        }}
      >
        {/* Center rod hole */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: beadSize * 0.2,
            height: beadSize * 0.35,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3))',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </motion.div>
  );
};