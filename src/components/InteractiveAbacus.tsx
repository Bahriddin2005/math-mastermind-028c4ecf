import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSound } from '@/hooks/useSound';

interface InteractiveAbacusProps {
  columns?: number;
  value?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  showValue?: boolean;
  compact?: boolean;
}

interface BeadState {
  upper: boolean; // 5 qiymatli yuqori boncuk
  lower: number; // 0-4 qiymatli pastki boncuklar soni
}

/**
 * Interaktiv Soroban Abakus Komponenti
 * - Sensorli (touch) boshqaruv
 * - Swipe yuqoriga/pastga
 * - Tap = toggle
 * - 1-5 ustunli qo'llab-quvvatlash
 */
export const InteractiveAbacus = ({
  columns = 3,
  value: controlledValue,
  onChange,
  readOnly = false,
  showValue = true,
  compact = false,
}: InteractiveAbacusProps) => {
  const { playSound } = useSound();
  const touchStartRef = useRef<{ y: number; columnIndex: number; isUpper: boolean } | null>(null);
  
  // Ustunlar holatini hisoblash
  const calculateColumnsFromValue = useCallback((num: number): BeadState[] => {
    const cols: BeadState[] = [];
    for (let i = 0; i < columns; i++) {
      const digit = Math.floor((num / Math.pow(10, i)) % 10);
      cols.push({
        upper: digit >= 5,
        lower: digit % 5,
      });
    }
    return cols;
  }, [columns]);

  const [internalColumns, setInternalColumns] = useState<BeadState[]>(() => 
    calculateColumnsFromValue(controlledValue ?? 0)
  );

  // Ustunlardan qiymatni hisoblash
  const calculateValueFromColumns = useCallback((cols: BeadState[]): number => {
    return cols.reduce((sum, col, index) => {
      const digit = (col.upper ? 5 : 0) + col.lower;
      return sum + digit * Math.pow(10, index);
    }, 0);
  }, []);

  const currentValue = controlledValue !== undefined 
    ? controlledValue 
    : calculateValueFromColumns(internalColumns);

  const currentColumns = controlledValue !== undefined
    ? calculateColumnsFromValue(controlledValue)
    : internalColumns;

  // Ustunni yangilash
  const updateColumn = useCallback((columnIndex: number, newState: BeadState) => {
    if (readOnly) return;

    const newColumns = [...currentColumns];
    newColumns[columnIndex] = newState;
    
    const newValue = calculateValueFromColumns(newColumns);
    
    if (controlledValue === undefined) {
      setInternalColumns(newColumns);
    }
    
    onChange?.(newValue);
    playSound('bead');
  }, [currentColumns, controlledValue, onChange, readOnly, calculateValueFromColumns, playSound]);

  // Yuqori boncukni toggle qilish
  const toggleUpper = useCallback((columnIndex: number) => {
    const col = currentColumns[columnIndex];
    updateColumn(columnIndex, { ...col, upper: !col.upper });
  }, [currentColumns, updateColumn]);

  // Pastki boncuklarni o'zgartirish
  const adjustLower = useCallback((columnIndex: number, delta: number) => {
    const col = currentColumns[columnIndex];
    const newLower = Math.max(0, Math.min(4, col.lower + delta));
    if (newLower !== col.lower) {
      updateColumn(columnIndex, { ...col, lower: newLower });
    }
  }, [currentColumns, updateColumn]);

  // Touch eventlar
  const handleTouchStart = (e: React.TouchEvent, columnIndex: number, isUpper: boolean) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      columnIndex,
      isUpper,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const { y: startY, columnIndex, isUpper } = touchStartRef.current;
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - startY;
    
    // Minimal swipe masofa
    if (Math.abs(deltaY) < 20) {
      // Tap - toggle
      if (isUpper) {
        toggleUpper(columnIndex);
      } else {
        // Pastki boncuklar uchun tap - 1 qo'shish/ayirish
        const col = currentColumns[columnIndex];
        if (col.lower < 4) {
          adjustLower(columnIndex, 1);
        } else {
          adjustLower(columnIndex, -4); // Reset to 0
        }
      }
    } else {
      // Swipe
      if (isUpper) {
        if (deltaY < 0) {
          // Swipe yuqoriga - faollashtirish
          if (!currentColumns[columnIndex].upper) {
            toggleUpper(columnIndex);
          }
        } else {
          // Swipe pastga - o'chirish
          if (currentColumns[columnIndex].upper) {
            toggleUpper(columnIndex);
          }
        }
      } else {
        // Pastki boncuklar
        if (deltaY < 0) {
          adjustLower(columnIndex, 1); // Swipe yuqoriga = +1
        } else {
          adjustLower(columnIndex, -1); // Swipe pastga = -1
        }
      }
    }
    
    touchStartRef.current = null;
  };

  // Mouse eventlar (desktop uchun)
  const handleClick = (columnIndex: number, isUpper: boolean, beadIndex?: number) => {
    if (readOnly) return;
    
    if (isUpper) {
      toggleUpper(columnIndex);
    } else if (beadIndex !== undefined) {
      const col = currentColumns[columnIndex];
      // Bosilgan boncukdan yuqoridagilarni o'chirish yoki pastdagilarni yoqish
      if (beadIndex < col.lower) {
        // Bu boncuk yoqilgan - uni va undan yuqoridagilarni o'chirish
        updateColumn(columnIndex, { ...col, lower: beadIndex });
      } else {
        // Bu boncuk o'chirilgan - uni va undan pastdagilarni yoqish
        updateColumn(columnIndex, { ...col, lower: beadIndex + 1 });
      }
    }
  };

  const beadSize = compact ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16';
  const columnGap = compact ? 'gap-1 sm:gap-2' : 'gap-2 sm:gap-3 md:gap-4';

  return (
    <div className="flex flex-col items-center">
      {/* Abakus ramkasi */}
      <div className="bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-2xl p-3 sm:p-4 shadow-xl">
        {/* Ustunlar */}
        <div className={cn("flex justify-center items-stretch", columnGap)}>
          {/* Ustunlarni teskari ko'rsatish (minglik -> birlik) */}
          {[...currentColumns].reverse().map((col, reversedIndex) => {
            const columnIndex = columns - 1 - reversedIndex;
            
            return (
              <div key={columnIndex} className="flex flex-col items-center">
                {/* Ustun nomi */}
                <div className="text-amber-200 text-[10px] sm:text-xs font-bold mb-1 opacity-70">
                  {columnIndex === 0 ? "1" : columnIndex === 1 ? "10" : columnIndex === 2 ? "100" : columnIndex === 3 ? "1K" : "10K"}
                </div>
                
                {/* Yuqori boncuk (5 qiymat) */}
                <div 
                  className="relative mb-1 sm:mb-2 cursor-pointer touch-none"
                  onTouchStart={(e) => handleTouchStart(e, columnIndex, true)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handleClick(columnIndex, true)}
                >
                  <motion.div
                    animate={{ 
                      y: col.upper ? 12 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      beadSize,
                      "rounded-full shadow-lg transition-colors duration-200",
                      col.upper 
                        ? "bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-red-900/50" 
                        : "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-gray-700/30",
                      !readOnly && "hover:scale-105 active:scale-95"
                    )}
                  >
                    {/* Boncuk parcha effekti */}
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                  </motion.div>
                </div>
                
                {/* O'rta chiziq (reckoning bar) */}
                <div className="w-full h-2 sm:h-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 rounded-full shadow-inner my-1" />
                
                {/* Pastki boncuklar (1 qiymat har biri) */}
                <div className="flex flex-col gap-0.5 sm:gap-1 touch-none">
                  {[0, 1, 2, 3].map((beadIndex) => {
                    const isActive = beadIndex < col.lower;
                    
                    return (
                      <div
                        key={beadIndex}
                        onTouchStart={(e) => handleTouchStart(e, columnIndex, false)}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => handleClick(columnIndex, false, beadIndex)}
                        className="cursor-pointer"
                      >
                        <motion.div
                          animate={{ 
                            y: isActive ? -10 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={cn(
                            beadSize,
                            "rounded-full shadow-lg transition-colors duration-200",
                            isActive 
                              ? "bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-emerald-900/50" 
                              : "bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-gray-700/30",
                            !readOnly && "hover:scale-105 active:scale-95"
                          )}
                        >
                          {/* Boncuk parcha effekti */}
                          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Qiymat ko'rsatkichi */}
      {showValue && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentValue}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="mt-4 px-6 py-2 bg-card border-2 border-primary/30 rounded-xl shadow-lg"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
              {currentValue.toLocaleString()}
            </span>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
