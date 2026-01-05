import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SorobanDisplayProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showNumber?: boolean;
  columns?: number;
  animated?: boolean;
  onBeadMove?: () => void;
  highlightDigit?: number | null;
  showHint?: boolean;
  theme?: 'classic' | 'bamboo' | 'modern';
}

export const SorobanDisplay = ({ 
  number, 
  size = 'md', 
  showNumber = true,
  columns = 1,
  animated = true,
  onBeadMove,
  highlightDigit = null,
  showHint = false,
  theme = 'bamboo'
}: SorobanDisplayProps) => {
  const prevNumberRef = useRef(number);
  const [animatingColumns, setAnimatingColumns] = useState<Set<number>>(new Set());
  
  const sizeConfig = {
    sm: { 
      bead: 'w-5 h-3.5', 
      rod: 'w-0.5 h-20', 
      gap: 'gap-0.5', 
      container: 'p-2',
      columnGap: 'gap-2',
      frameWidth: 'w-auto',
      beadOffset: 8
    },
    md: { 
      bead: 'w-7 h-5', 
      rod: 'w-1 h-28', 
      gap: 'gap-0.5', 
      container: 'p-3',
      columnGap: 'gap-3',
      frameWidth: 'w-auto',
      beadOffset: 10
    },
    lg: { 
      bead: 'w-9 h-6', 
      rod: 'w-1 h-36', 
      gap: 'gap-1', 
      container: 'p-4',
      columnGap: 'gap-4',
      frameWidth: 'w-auto',
      beadOffset: 12
    },
    xl: { 
      bead: 'w-12 h-8', 
      rod: 'w-1.5 h-44', 
      gap: 'gap-1', 
      container: 'p-5',
      columnGap: 'gap-5',
      frameWidth: 'w-auto',
      beadOffset: 16
    },
  };

  const themeConfig = {
    classic: {
      frame: 'bg-gradient-to-br from-amber-800 via-amber-900 to-amber-950',
      innerFrame: 'bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100',
      rod: 'bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900',
      beadActive: 'from-red-400 via-red-500 to-red-600 shadow-red-500/40',
      beadInactive: 'from-amber-200 via-amber-300 to-amber-400 shadow-amber-400/20',
      bar: 'bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900',
      border: 'border-amber-700'
    },
    bamboo: {
      frame: 'bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950',
      innerFrame: 'bg-gradient-to-b from-green-50 via-emerald-50 to-green-50',
      rod: 'bg-gradient-to-b from-yellow-700 via-yellow-800 to-yellow-900',
      beadActive: 'from-orange-400 via-orange-500 to-orange-600 shadow-orange-500/40',
      beadInactive: 'from-yellow-100 via-yellow-200 to-yellow-300 shadow-yellow-400/20',
      bar: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800',
      border: 'border-emerald-600'
    },
    modern: {
      frame: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
      innerFrame: 'bg-gradient-to-b from-slate-50 via-white to-slate-50',
      rod: 'bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700',
      beadActive: 'from-primary via-primary to-primary/80 shadow-primary/40',
      beadInactive: 'from-slate-200 via-slate-300 to-slate-400 shadow-slate-400/20',
      bar: 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700',
      border: 'border-slate-600'
    }
  };

  const styles = sizeConfig[size];
  const colors = themeConfig[theme];

  // Raqam o'zgarganda animatsiya
  useEffect(() => {
    if (prevNumberRef.current !== number) {
      if (onBeadMove && animated) {
        onBeadMove();
      }
      
      // Qaysi ustunlar o'zgarganini aniqlash
      const prevDigits = getDigits(prevNumberRef.current, columns);
      const newDigits = getDigits(number, columns);
      
      const changed = new Set<number>();
      for (let i = 0; i < columns; i++) {
        if (prevDigits[i] !== newDigits[i]) {
          changed.add(i);
        }
      }
      
      setAnimatingColumns(changed);
      setTimeout(() => setAnimatingColumns(new Set()), 300);
      
      prevNumberRef.current = number;
    }
  }, [number, onBeadMove, animated, columns]);

  // Raqamlarni ustunlarga ajratish
  const getDigits = useCallback((num: number, colCount: number): number[] => {
    const absNum = Math.abs(num);
    const digits: number[] = [];
    
    for (let i = 0; i < colCount; i++) {
      const divisor = Math.pow(10, i);
      const digit = Math.floor(absNum / divisor) % 10;
      digits.unshift(digit);
    }
    
    return digits;
  }, []);

  const digits = getDigits(number, columns);

  // Ustun nomlari
  const columnLabels = ['Ming', 'Yuz', "O'n", 'Bir'];
  const getColumnLabel = (index: number, total: number) => {
    const startIndex = 4 - total;
    return columnLabels[startIndex + index] || '';
  };

  const renderBead = (isActive: boolean, isTop: boolean, beadIndex: number, columnIndex: number) => {
    const isHighlighted = highlightDigit !== null && columnIndex === highlightDigit;
    const isAnimating = animatingColumns.has(columnIndex);
    
    const activeOffset = isTop ? styles.beadOffset : -styles.beadOffset;
    
    return (
      <div
        key={beadIndex}
        className={cn(
          styles.bead,
          'rounded-full relative overflow-hidden',
          animated && 'transition-all duration-300 ease-out',
          isAnimating && 'scale-110',
          isHighlighted && 'ring-2 ring-yellow-400 ring-offset-1'
        )}
        style={{
          background: isActive
            ? `linear-gradient(135deg, var(--tw-gradient-stops))`
            : `linear-gradient(135deg, var(--tw-gradient-stops))`,
          transform: isActive 
            ? `translateY(${activeOffset}px)` 
            : 'translateY(0)',
          boxShadow: isActive 
            ? `0 4px 12px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.4)`
            : `0 2px 6px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)`,
        }}
      >
        {/* Bead gradient overlay */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br',
          isActive ? colors.beadActive : colors.beadInactive
        )} />
        
        {/* Shine effect */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-t-full" />
        
        {/* Center hole simulation */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-black/20 rounded-full mx-1" />
      </div>
    );
  };

  const renderColumn = (digit: number, columnIndex: number) => {
    const topBeadActive = digit >= 5;
    const bottomBeadsActive = digit >= 5 ? digit - 5 : digit;
    const isAnimating = animatingColumns.has(columnIndex);

    return (
      <div 
        key={columnIndex} 
        className={cn(
          "flex flex-col items-center",
          isAnimating && "animate-pulse"
        )}
      >
        {/* Ustun belgisi */}
        {columns > 1 && (
          <div className={cn(
            "text-xs font-medium mb-1.5 opacity-70",
            theme === 'modern' ? 'text-slate-600' : theme === 'bamboo' ? 'text-emerald-700' : 'text-amber-700'
          )}>
            {getColumnLabel(columnIndex, columns)}
          </div>
        )}
        
        <div className="relative flex flex-col items-center">
          {/* Ustun (rod) */}
          <div 
            className={cn(
              "absolute rounded-full z-0",
              styles.rod,
              colors.rod,
              "shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]"
            )} 
          />
          
          {/* Yuqori qism - 1 boncuk (5 qiymat) */}
          <div className={cn("flex flex-col z-10 mb-1", styles.gap)}>
            {renderBead(topBeadActive, true, 0, columnIndex)}
          </div>

          {/* Ajratuvchi chiziq (reckoning bar) */}
          <div 
            className={cn(
              "w-10 h-1.5 rounded z-10 my-1 shadow-md",
              size === 'sm' && 'w-8 h-1',
              size === 'lg' && 'w-12 h-2',
              size === 'xl' && 'w-14 h-2',
              colors.bar
            )} 
          />

          {/* Pastki qism - 4 boncuk (1 qiymat har biri) */}
          <div className={cn("flex flex-col z-10 mt-1", styles.gap)}>
            {[0, 1, 2, 3].map((index) => {
              // Pastki boncuklar: yuqoridan pastga, faol boncuklar yuqoriga ko'tariladi
              const isActive = (3 - index) < bottomBeadsActive;
              return renderBead(isActive, false, index, columnIndex);
            })}
          </div>
        </div>
        
        {/* Raqam ko'rsatkichi */}
        {columns > 1 && showNumber && (
          <div className={cn(
            "mt-2 text-lg font-bold",
            theme === 'modern' ? 'text-slate-700' : theme === 'bamboo' ? 'text-emerald-800' : 'text-amber-800'
          )}>
            {digit}
          </div>
        )}
      </div>
    );
  };

  // Hint component - formula tushuntirish
  const renderHint = () => {
    if (!showHint) return null;
    
    const digit = digits[digits.length - 1]; // Eng kichik xona
    const topValue = digit >= 5 ? 5 : 0;
    const bottomValue = digit >= 5 ? digit - 5 : digit;
    
    return (
      <div className={cn(
        "mt-3 p-2 rounded-lg text-xs text-center",
        theme === 'modern' ? 'bg-slate-100 text-slate-600' : 
        theme === 'bamboo' ? 'bg-emerald-100 text-emerald-700' : 
        'bg-amber-100 text-amber-700'
      )}>
        <div className="font-medium">
          {digit} = {topValue > 0 ? `${topValue} + ` : ''}{bottomValue}
        </div>
        {topValue > 0 && (
          <div className="opacity-70">Yuqori boncuk (5) + {bottomValue} pastki</div>
        )}
        {topValue === 0 && (
          <div className="opacity-70">{bottomValue} ta pastki boncuk</div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col items-center", styles.container)}>
      {/* Soroban ramkasi */}
      <div 
        className={cn(
          "rounded-2xl p-1.5 shadow-xl",
          colors.frame,
          colors.border,
          "border-2"
        )}
      >
        {/* Ichki ramka */}
        <div 
          className={cn(
            "rounded-xl p-3 shadow-inner border",
            colors.innerFrame,
            theme === 'modern' ? 'border-slate-200' : 
            theme === 'bamboo' ? 'border-emerald-200' : 
            'border-amber-200'
          )}
        >
          {/* Ustunlar */}
          <div className={cn("flex justify-center", styles.columnGap)}>
            {digits.map((digit, index) => renderColumn(digit, index))}
          </div>
        </div>
      </div>
      
      {/* Hint */}
      {renderHint()}
      
      {/* Umumiy son ko'rsatkichi */}
      {showNumber && columns === 1 && (
        <div 
          className={cn(
            "mt-4 font-bold font-display transition-all duration-300",
            size === 'sm' ? 'text-3xl' : size === 'md' ? 'text-4xl' : size === 'lg' ? 'text-5xl' : 'text-6xl',
            theme === 'modern' ? 'text-primary' : 
            theme === 'bamboo' ? 'text-emerald-600' : 
            'text-amber-600'
          )}
        >
          {number}
        </div>
      )}
    </div>
  );
};

export default SorobanDisplay;
