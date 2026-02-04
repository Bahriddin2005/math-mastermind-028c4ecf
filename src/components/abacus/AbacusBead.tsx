import { useRef, useState, useMemo } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

// Rainbow colors for lower beads
export type BeadColorType = 'green' | 'red' | 'orange' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'pink';

// Helper function to darken/lighten a hex color
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
 * Diamond/Rhombus shaped Abacus Bead with 3D effect
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
  const ACTIVE_OFFSET = beadSize * 0.35;
  
  // Default terracotta color matching the reference image
  const baseColor = customColor || '#A0522D';
  
  const colors = useMemo(() => {
    return {
      top: adjustColor(baseColor, 15),      // Lighter top
      middle: baseColor,                     // Base color
      bottom: adjustColor(baseColor, -40),   // Much darker bottom
      highlight: adjustColor(baseColor, 30), // Highlight
    };
  }, [baseColor]);
  
  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
    onMoveStart?.();
  };
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
    
    onMoveEnd?.();
  };
  
  const handleTap = () => {
    if (disabled) return;
    if (isActive) {
      onDeactivate();
    } else {
      onActivate();
    }
  };
  
  const getActiveOffset = () => {
    if (isUpper) {
      return isActive ? ACTIVE_OFFSET : 0;
    } else {
      return isActive ? -ACTIVE_OFFSET * 0.5 : 0;
    }
  };

  // Diamond bead dimensions
  const beadWidth = beadSize * 1.6;
  const beadHeight = beadSize * 0.7;

  return (
    <motion.div
      ref={beadRef}
      className={cn(
        "relative cursor-pointer touch-none select-none",
        isDragging && "z-20",
        !disabled && "hover:brightness-110 active:brightness-95",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      style={{
        width: beadWidth,
        height: beadHeight,
      }}
      drag={disabled ? false : "y"}
      dragConstraints={{ top: -beadSize, bottom: beadSize }}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTap={handleTap}
      whileTap={{ scale: 0.98 }}
      animate={{
        y: getActiveOffset(),
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Diamond/Rhombus shape using SVG for precise control */}
      <svg
        width={beadWidth}
        height={beadHeight}
        viewBox={`0 0 ${beadWidth} ${beadHeight}`}
        className="absolute inset-0"
        style={{
          filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        <defs>
          {/* Gradient for 3D effect */}
          <linearGradient id={`bead-gradient-${baseColor.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.top} />
            <stop offset="40%" stopColor={colors.middle} />
            <stop offset="100%" stopColor={colors.bottom} />
          </linearGradient>
          
          {/* Highlight gradient */}
          <linearGradient id={`bead-highlight-${baseColor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        {/* Main diamond shape - hexagonal/rhombus */}
        <polygon
          points={`
            ${beadWidth * 0.5},0
            ${beadWidth},${beadHeight * 0.35}
            ${beadWidth},${beadHeight * 0.65}
            ${beadWidth * 0.5},${beadHeight}
            0,${beadHeight * 0.65}
            0,${beadHeight * 0.35}
          `}
          fill={`url(#bead-gradient-${baseColor.replace('#', '')})`}
          stroke={colors.bottom}
          strokeWidth="1"
        />
        
        {/* Top face highlight */}
        <polygon
          points={`
            ${beadWidth * 0.5},${beadHeight * 0.05}
            ${beadWidth * 0.9},${beadHeight * 0.35}
            ${beadWidth * 0.5},${beadHeight * 0.45}
            ${beadWidth * 0.1},${beadHeight * 0.35}
          `}
          fill={`url(#bead-highlight-${baseColor.replace('#', '')})`}
        />
        
        {/* Center hole for rod */}
        <ellipse
          cx={beadWidth * 0.5}
          cy={beadHeight * 0.5}
          rx={beadWidth * 0.06}
          ry={beadHeight * 0.15}
          fill="rgba(0,0,0,0.3)"
        />
      </svg>
    </motion.div>
  );
};