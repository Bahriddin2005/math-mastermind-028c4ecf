import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AbacusBeadProps {
  isUpper: boolean;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  beadSize: number;
  color?: 'red' | 'green' | 'blue' | 'brown';
  disabled?: boolean;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
}

/**
 * Individual Abacus Bead with Drag Support
 * 
 * Soroban qoidalariga mos:
 * - Yuqori tosh: faqat pastga tushsa aktiv
 * - Pastki tosh: faqat yuqoriga ko'tarilsa aktiv
 * - Smooth snap animation
 * - Touch va mouse support
 */
export const AbacusBead = ({
  isUpper,
  isActive,
  onActivate,
  onDeactivate,
  beadSize,
  color = isUpper ? 'red' : 'green',
  disabled = false,
  onMoveStart,
  onMoveEnd,
}: AbacusBeadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const beadRef = useRef<HTMLDivElement>(null);
  
  // Drag uchun motion values
  const y = useMotionValue(0);
  
  // Snap thresholds
  const SNAP_THRESHOLD = beadSize * 0.4;
  const ACTIVE_OFFSET = beadSize * 0.8;
  
  // Rang palitralari
  const colorMap = {
    red: {
      gradient: 'from-red-400 via-red-500 to-red-700',
      shadow: 'shadow-red-900/50',
      highlight: 'from-red-300/60',
      glow: 'rgba(239, 68, 68, 0.4)',
    },
    green: {
      gradient: 'from-emerald-400 via-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-900/50',
      highlight: 'from-emerald-300/60',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    blue: {
      gradient: 'from-blue-400 via-blue-500 to-blue-700',
      shadow: 'shadow-blue-900/50',
      highlight: 'from-blue-300/60',
      glow: 'rgba(59, 130, 246, 0.4)',
    },
    brown: {
      gradient: 'from-amber-600 via-amber-700 to-amber-900',
      shadow: 'shadow-amber-900/50',
      highlight: 'from-amber-400/60',
      glow: 'rgba(217, 119, 6, 0.4)',
    },
  };
  
  const colors = colorMap[color];
  
  // Drag boshlanishi
  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);
    onMoveStart?.();
  };
  
  // Drag tugashi
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    setIsDragging(false);
    
    const offset = info.offset.y;
    
    if (isUpper) {
      // Yuqori tosh: pastga tushsa aktiv
      if (!isActive && offset > SNAP_THRESHOLD) {
        onActivate();
      } else if (isActive && offset < -SNAP_THRESHOLD) {
        onDeactivate();
      }
    } else {
      // Pastki tosh: yuqoriga ko'tarilsa aktiv
      if (!isActive && offset < -SNAP_THRESHOLD) {
        onActivate();
      } else if (isActive && offset > SNAP_THRESHOLD) {
        onDeactivate();
      }
    }
    
    // Reset position
    y.set(0);
    onMoveEnd?.();
  };
  
  // Click/Tap handler - toggle state
  const handleTap = () => {
    if (disabled) return;
    if (isActive) {
      onDeactivate();
    } else {
      onActivate();
    }
  };
  
  // Calculate position based on active state
  const getActiveOffset = () => {
    if (isUpper) {
      return isActive ? ACTIVE_OFFSET : 0;
    } else {
      return isActive ? -ACTIVE_OFFSET * 0.6 : 0;
    }
  };

  return (
    <motion.div
      ref={beadRef}
      className={cn(
        "relative cursor-pointer touch-none select-none rounded-full",
        "shadow-lg transition-shadow duration-200",
        colors.shadow,
        isDragging && "z-20",
        !disabled && "hover:scale-105 active:scale-95",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      style={{
        width: beadSize,
        height: beadSize,
        y: useTransform(y, (val) => val + getActiveOffset()),
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
        boxShadow: isDragging 
          ? `0 8px 25px -4px ${colors.glow}` 
          : `0 4px 12px -2px ${colors.glow}`,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Asosiy gradient */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full",
          "bg-gradient-to-br",
          colors.gradient
        )}
      />
      
      {/* 3D Highlight effect */}
      <div 
        className={cn(
          "absolute inset-[3px] rounded-full",
          "bg-gradient-to-br to-transparent",
          colors.highlight
        )}
        style={{
          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 60%)`,
        }}
      />
      
      {/* Center reflection */}
      <div 
        className="absolute rounded-full"
        style={{
          top: '20%',
          left: '20%',
          width: '25%',
          height: '25%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
        }}
      />
      
      {/* Bottom shadow for 3D depth */}
      <div 
        className="absolute rounded-full"
        style={{
          bottom: '10%',
          left: '15%',
          right: '15%',
          height: '20%',
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.3))',
          borderRadius: '50%',
        }}
      />
      
      {/* Active glow effect */}
      {isActive && (
        <motion.div
          className="absolute -inset-1 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};
