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
  * Fun rounded 3D bead - colorful kids-friendly style
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
   
   // Vibrant colors for kids
   const baseColor = customColor || '#FF6B6B';
   
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
 
   // Round bead dimensions - fun and friendly
   const beadWidth = beadSize * 1.4;
   const beadHeight = beadSize * 0.9;
   
   // Generate lighter and darker shades
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
   const gradientId = `bead-grad-${baseColor.replace('#', '')}`;
   const shineId = `bead-shine-${baseColor.replace('#', '')}`;
 
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
         filter: isDragging ? `drop-shadow(0 0 12px ${glowColor})` : 'none',
       }}
       drag={disabled ? false : "y"}
       dragConstraints={{ top: -beadSize, bottom: beadSize }}
       dragElastic={0.1}
       onDragStart={handleDragStart}
       onDragEnd={handleDragEnd}
       animate={{ y: getActiveOffset() }}
       transition={{ type: 'spring', stiffness: 400, damping: 25 }}
       whileHover={{ scale: 1.05 }}
       whileTap={{ scale: 0.95 }}
     >
       {/* 3D Rounded Bead - Fun Style */}
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
             <stop offset="0%" stopColor="white" stopOpacity="0.7" />
             <stop offset="100%" stopColor="white" stopOpacity="0" />
           </radialGradient>
         </defs>
         
         {/* Main bead body - rounded oval */}
         <ellipse
           cx="50"
           cy="32"
           rx="45"
           ry="24"
           fill={`url(#${gradientId})`}
           style={{ filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.3))' }}
         />
         
         {/* Top shine highlight */}
         <ellipse
           cx="35"
           cy="22"
           rx="20"
           ry="10"
           fill={`url(#${shineId})`}
         />
         
         {/* Bottom reflection */}
         <ellipse
           cx="50"
           cy="48"
           rx="30"
           ry="6"
           fill="white"
           opacity="0.15"
         />
         
         {/* Center rod hole */}
         <ellipse
           cx="50"
           cy="30"
           rx="5"
           ry="5"
           fill={darkerColor}
         />
       </svg>
     </motion.div>
   );
 };