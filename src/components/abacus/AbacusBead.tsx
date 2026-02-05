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
 * Diamond/Hexagonal 3D bead - terracotta style matching reference
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
  
  // Terracotta brown-red matching reference exactly
  const baseColor = customColor || '#A0522D';
  
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

  // Diamond bead dimensions matching reference
  const beadWidth = beadSize * 1.8;
  const beadHeight = beadSize * 0.7;

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
      {/* 3D Diamond/Hexagonal Bead - SVG */}
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        {/* Bottom dark shadow face */}
        <polygon
          points="50,40 0,24 0,16 50,32 100,16 100,24"
          fill="#2D1810"
        />
        
        {/* Main middle face - base color */}
        <polygon
          points="50,32 0,16 50,0 100,16"
          fill={baseColor}
        />
        
        {/* Top highlight face */}
        <polygon
          points="50,6 20,16 50,26 80,16"
          fill="#C4704A"
          opacity="0.7"
        />
        
        {/* Left edge shadow */}
        <polygon
          points="0,16 0,24 50,40 50,32"
          fill="#1A0F0A"
          opacity="0.6"
        />
        
        {/* Right edge shadow (lighter) */}
        <polygon
          points="100,16 100,24 50,40 50,32"
          fill="#1A0F0A"
          opacity="0.4"
        />
        
        {/* Center rod hole */}
        <ellipse
          cx="50"
          cy="20"
          rx="4"
          ry="5"
          fill="rgba(0,0,0,0.5)"
        />
      </svg>
    </motion.div>
  );
};