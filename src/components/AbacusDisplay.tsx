import { useEffect, useRef, useCallback } from 'react';

interface AbacusDisplayProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  columns?: number; // 1 = birliklar, 2 = o'nliklar, 3 = yuzliklar
  animated?: boolean;
  onBeadMove?: () => void;
}

export const AbacusDisplay = ({ 
  number, 
  size = 'md', 
  showNumber = true,
  columns = 1,
  animated = true,
  onBeadMove
}: AbacusDisplayProps) => {
  const prevNumberRef = useRef(number);
  
  const sizeClasses = {
    sm: { 
      bead: 'w-5 h-5', 
      rod: 'w-1 h-24', 
      gap: 'gap-1', 
      container: 'p-2',
      columnGap: 'gap-3',
      beadMove: 'translate-y-3',
      beadMoveNeg: '-translate-y-3'
    },
    md: { 
      bead: 'w-7 h-7', 
      rod: 'w-1.5 h-32', 
      gap: 'gap-1.5', 
      container: 'p-4',
      columnGap: 'gap-4',
      beadMove: 'translate-y-4',
      beadMoveNeg: '-translate-y-4'
    },
    lg: { 
      bead: 'w-9 h-9', 
      rod: 'w-2 h-40', 
      gap: 'gap-2', 
      container: 'p-6',
      columnGap: 'gap-6',
      beadMove: 'translate-y-5',
      beadMoveNeg: '-translate-y-5'
    },
  };

  const styles = sizeClasses[size];

  // Boncuk harakati aniqlash
  useEffect(() => {
    if (prevNumberRef.current !== number && onBeadMove) {
      onBeadMove();
    }
    prevNumberRef.current = number;
  }, [number, onBeadMove]);

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
  const columnLabels = ['Yuzliklar', "O'nliklar", 'Birliklar'];
  const getColumnLabel = (index: number, total: number) => {
    const startIndex = 3 - total;
    return columnLabels[startIndex + index];
  };

  const renderBead = (isActive: boolean, isTop: boolean, key?: number) => {
    const moveClass = isTop 
      ? (isActive ? styles.beadMove : '') 
      : (isActive ? styles.beadMoveNeg : '');
    
    return (
      <div
        key={key}
        className={`
          ${styles.bead} 
          rounded-full 
          ${animated ? 'transition-all duration-500 ease-out' : ''}
          ${isActive
            ? `bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 
               shadow-[0_4px_12px_rgba(217,119,6,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] 
               ${moveClass}`
            : `bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 
               shadow-[0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.5)]`
          }
          hover:scale-105
        `}
        style={{
          transform: isActive 
            ? `translateY(${isTop ? '12px' : '-12px'}) scale(1.02)` 
            : 'translateY(0) scale(1)',
        }}
      />
    );
  };

  const renderColumn = (digit: number, columnIndex: number) => {
    const topBeadActive = digit >= 5;
    const bottomBeadsActive = digit >= 5 ? digit - 5 : digit;

    return (
      <div key={columnIndex} className="flex flex-col items-center">
        {/* Ustun belgisi */}
        {columns > 1 && (
          <div className="text-xs text-amber-700 font-medium mb-2 opacity-70">
            {getColumnLabel(columnIndex, columns)}
          </div>
        )}
        
        <div className="relative flex flex-col items-center">
          {/* Ustun (rod) */}
          <div 
            className={`
              absolute ${styles.rod} 
              bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 
              rounded-full z-0
              shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]
            `} 
          />
          
          {/* Yuqori qism - 1 boncuk (5 qiymat) */}
          <div className={`flex flex-col ${styles.gap} z-10 mb-3`}>
            {renderBead(topBeadActive, true)}
          </div>

          {/* Ajratuvchi chiziq (reckoning bar) */}
          <div 
            className="w-12 h-1.5 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded z-10 my-1 shadow-md" 
          />

          {/* Pastki qism - 4 boncuk (1 qiymat har biri) */}
          <div className={`flex flex-col ${styles.gap} z-10 mt-3`}>
            {[0, 1, 2, 3].map((index) => {
              // Pastki boncuklar: yuqoridan pastga, faol boncuklar yuqoriga ko'tariladi
              const isActive = (3 - index) < bottomBeadsActive;
              return renderBead(isActive, false, index);
            })}
          </div>
        </div>
        
        {/* Raqam ko'rsatkichi */}
        {columns > 1 && (
          <div className="mt-2 text-lg font-bold text-amber-800">
            {digit}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center ${styles.container}`}>
      {/* Abacus ramkasi */}
      <div 
        className="
          bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 
          rounded-2xl p-5 
          shadow-[0_8px_32px_rgba(217,119,6,0.2),inset_0_2px_8px_rgba(255,255,255,0.5)] 
          border-2 border-amber-300
        "
      >
        {/* Ichki ramka */}
        <div 
          className="
            bg-gradient-to-b from-amber-50 to-white 
            rounded-xl p-4 
            shadow-inner
            border border-amber-200
          "
        >
          {/* Ustunlar */}
          <div className={`flex ${styles.columnGap} justify-center`}>
            {digits.map((digit, index) => renderColumn(digit, index))}
          </div>
        </div>
      </div>
      
      {/* Umumiy son ko'rsatkichi */}
      {showNumber && (
        <div 
          className={`
            mt-4 font-bold text-primary font-display
            ${animated ? 'transition-all duration-300' : ''}
            ${columns === 1 ? 'text-5xl' : columns === 2 ? 'text-4xl' : 'text-3xl'}
          `}
        >
          {number}
        </div>
      )}
    </div>
  );
};

export default AbacusDisplay;
