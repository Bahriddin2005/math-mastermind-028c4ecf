import { useRef, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

// Rainbow colors for lower beads
export type BeadColorType = 'green' | 'red' | 'orange' | 'yellow' | 'cyan' | 'blue' | 'purple' | 'pink';

interface AbacusBeadProps {
  isUpper: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  beadSize: number;
  color?: BeadColorType;
  disabled?: boolean;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}

// Color palette matching the reference image
const colorPalette: Record<BeadColorType, { 
  bg: string; 
  border: string;
  shadow: string;
  highlight: string;
}> = {
  green: {
    bg: '#6CBE45',
    border: '#5AAD35',
    shadow: 'rgba(90, 173, 53, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  red: {
    bg: '#EF5350',
    border: '#E53935',
    shadow: 'rgba(229, 57, 53, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  orange: {
    bg: '#FFA726',
    border: '#FB8C00',
    shadow: 'rgba(251, 140, 0, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  yellow: {
    bg: '#FFEE58',
    border: '#FDD835',
    shadow: 'rgba(253, 216, 53, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.5)',
  },
  cyan: {
    bg: '#26C6DA',
    border: '#00ACC1',
    shadow: 'rgba(0, 172, 193, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  blue: {
    bg: '#42A5F5',
    border: '#1E88E5',
    shadow: 'rgba(30, 136, 229, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  purple: {
    bg: '#AB47BC',
    border: '#8E24AA',
    shadow: 'rgba(142, 36, 170, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
  pink: {
    bg: '#EC407A',
    border: '#D81B60',
    shadow: 'rgba(216, 27, 96, 0.5)',
    highlight: 'rgba(255, 255, 255, 0.4)',
  },
};

/**
 * Individual Abacus Bead - Soroban style matching reference image
 */
export const AbacusBead = ({
  isUpper,
  isActive,
  onActivate,
  onDeactivate,
  beadSize,
  color = 'green',
  disabled = false,
  onMoveStart,
  onMoveEnd,
}: AbacusBeadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const beadRef = useRef<HTMLDivElement>(null);
  
  const SNAP_THRESHOLD = beadSize * 0.3;
  const ACTIVE_OFFSET = beadSize * 1.0;
  
  const colors = colorPalette[color];
  
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

  // Pill-shaped bead dimensions
  const beadHeight = beadSize * 0.6;
  const beadWidth = beadSize;

  return (
    <motion.div
      ref={beadRef}
      className={cn(
        "relative cursor-pointer touch-none select-none",
        "transition-shadow duration-200",
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
      whileTap={{ scale: 0.95 }}
      animate={{
        y: getActiveOffset(),
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {/* Main bead body - pill shape */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          boxShadow: isDragging 
            ? `0 4px 12px ${colors.shadow}` 
            : `0 2px 6px ${colors.shadow}`,
        }}
      />
      
      {/* Top highlight for 3D effect */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '10%',
          left: '15%',
          right: '15%',
          height: '30%',
          background: `linear-gradient(to bottom, ${colors.highlight}, transparent)`,
          borderRadius: '50%',
        }}
      />
      
      {/* Center hole effect (rod goes through) */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: beadWidth * 0.15,
          height: beadHeight * 0.5,
          background: 'rgba(0,0,0,0.15)',
        }}
      />
    </motion.div>
  );
};
