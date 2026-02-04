import { useRef, useState, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

export type BeadColorType = 'green' | 'red' | 'orange' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'pink';

const adjustColor = (hex: string, percent: number): string => {
  hex = hex.replace(/^#/, '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

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
  
  // Terracotta brown matching reference
  const baseColor = customColor || '#8B4513';
  
  const colors = useMemo(() => ({
    topFace: adjustColor(baseColor, 20),
    middleFace: baseColor,
    bottomFace: adjustColor(baseColor, -50),
    edge: adjustColor(baseColor, -30),
  }), [baseColor]);
  
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
  
  const handleTap = () => {
    if (disabled) return;
    isActive ? onDeactivate() : onActivate();
  };
  
  const getActiveOffset = () => {
    if (isUpper) return isActive ? ACTIVE_OFFSET : 0;
    return isActive ? -ACTIVE_OFFSET * 0.6 : 0;
  };

  // Diamond dimensions matching reference
  const beadWidth = beadSize * 1.8;
  const beadHeight = beadSize * 0.65;

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
      onTap={handleTap}
      whileTap={{ scale: 0.98 }}
      animate={{ y: getActiveOffset() }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox={`0 0 100 36`}
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        {/* Bottom dark face */}
        <polygon
          points="50,36 0,22 0,14 50,28 100,14 100,22"
          fill={colors.bottomFace}
        />
        
        {/* Middle face - main color */}
        <polygon
          points="50,28 0,14 50,0 100,14"
          fill={colors.middleFace}
        />
        
        {/* Top highlight */}
        <polygon
          points="50,4 15,14 50,24 85,14"
          fill={colors.topFace}
          opacity="0.6"
        />
        
        {/* Left edge shadow */}
        <polygon
          points="0,14 0,22 50,36 50,28"
          fill={colors.edge}
          opacity="0.5"
        />
        
        {/* Right edge shadow */}
        <polygon
          points="100,14 100,22 50,36 50,28"
          fill={colors.edge}
          opacity="0.3"
        />
        
        {/* Center rod hole */}
        <ellipse
          cx="50"
          cy="18"
          rx="4"
          ry="6"
          fill="rgba(0,0,0,0.4)"
        />
      </svg>
    </motion.div>
  );
};