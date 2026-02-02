import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { AbacusBead } from './AbacusBead';
import { cn } from '@/lib/utils';

interface AbacusColumnProps {
  columnIndex: number;
  upperActive: boolean;
  lowerCount: number; // 0-4 arası aktiv pastki toshlar
  onUpperChange: (active: boolean) => void;
  onLowerChange: (count: number) => void;
  beadSize?: number;
  showLabel?: boolean;
  disabled?: boolean;
  onBeadSound?: (isUpper: boolean) => void;
  beadColor?: 'red' | 'green' | 'blue' | 'brown';
  lowerBeadColor?: 'red' | 'green' | 'blue' | 'brown';
}

/**
 * Abakus ustuni - 1 yuqori + 4 pastki tosh
 * Soroban qoidalariga mos hisoblash
 */
export const AbacusColumn = ({
  columnIndex,
  upperActive,
  lowerCount,
  onUpperChange,
  onLowerChange,
  beadSize = 48,
  showLabel = true,
  disabled = false,
  onBeadSound,
  beadColor = 'red',
  lowerBeadColor = 'green',
}: AbacusColumnProps) => {
  
  // Ustun label'lari
  const getColumnLabel = () => {
    const labels = ['1', '10', '100', '1K', '10K', '100K'];
    return labels[columnIndex] || `10^${columnIndex}`;
  };
  
  const getColumnName = () => {
    const names = ['Birlik', "O'nlik", 'Yuzlik', 'Minglik', "O'n minglik", "Yuz minglik"];
    return names[columnIndex] || '';
  };
  
  // Yuqori tosh toggle
  const handleUpperActivate = useCallback(() => {
    if (!upperActive) {
      onUpperChange(true);
      onBeadSound?.(true);
    }
  }, [upperActive, onUpperChange, onBeadSound]);
  
  const handleUpperDeactivate = useCallback(() => {
    if (upperActive) {
      onUpperChange(false);
      onBeadSound?.(true);
    }
  }, [upperActive, onUpperChange, onBeadSound]);
  
  // Pastki tosh aktivlash (index = 0 eng pastki)
  const handleLowerActivate = useCallback((beadIndex: number) => {
    // beadIndex dan katta barcha toshlarni aktiv qilish
    const newCount = Math.max(lowerCount, beadIndex + 1);
    if (newCount !== lowerCount) {
      onLowerChange(newCount);
      onBeadSound?.(false);
    }
  }, [lowerCount, onLowerChange, onBeadSound]);
  
  const handleLowerDeactivate = useCallback((beadIndex: number) => {
    // beadIndex dan kichik barcha toshlarni aktiv qilish (o'zi va yuqorisini o'chirish)
    const newCount = Math.min(lowerCount, beadIndex);
    if (newCount !== lowerCount) {
      onLowerChange(newCount);
      onBeadSound?.(false);
    }
  }, [lowerCount, onLowerChange, onBeadSound]);
  
  // Ustun qiymati
  const columnValue = (upperActive ? 5 : 0) + lowerCount;
  
  return (
    <div className="flex flex-col items-center">
      {/* Ustun labeli */}
      {showLabel && (
        <div className="text-center mb-1">
          <div className="text-amber-200/80 text-[10px] sm:text-xs font-bold">
            {getColumnLabel()}
          </div>
          <div className="text-amber-300/60 text-[8px] hidden sm:block">
            {getColumnName()}
          </div>
        </div>
      )}
      
      {/* Abakus ustuni konteyner */}
      <div className="relative flex flex-col items-center">
        {/* Rod/Tayoq - markaziy vertikal chiziq */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 sm:w-2 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-full z-0"
          style={{
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3), inset -1px 0 2px rgba(255,255,255,0.1)',
          }}
        />
        
        {/* Yuqori tosh (5 qiymat) */}
        <div className="relative z-10 mb-1">
          <AbacusBead
            isUpper={true}
            isActive={upperActive}
            onActivate={handleUpperActivate}
            onDeactivate={handleUpperDeactivate}
            beadSize={beadSize}
            color={beadColor}
            disabled={disabled}
          />
        </div>
        
        {/* Reckoning bar - hisob chizig'i */}
        <div 
          className="relative z-20 w-full my-1 sm:my-1.5"
          style={{ 
            height: beadSize * 0.25,
            minHeight: 8,
          }}
        >
          <div 
            className={cn(
              "absolute left-1/2 -translate-x-1/2",
              "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600",
              "rounded-full shadow-md"
            )}
            style={{
              width: beadSize * 1.8,
              height: '100%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
            }}
          />
        </div>
        
        {/* Pastki toshlar (har biri 1 qiymat) - 4 ta */}
        <div className="relative z-10 flex flex-col items-center gap-0.5 sm:gap-1">
          {/* Toshlar tepadan pastga: 3, 2, 1, 0 (eng past = index 0) */}
          {[3, 2, 1, 0].map((visualIndex) => {
            // visualIndex 3 = eng tepa pastki tosh (index = 3 in lowerCount logic)
            // visualIndex 0 = eng past pastki tosh (index = 0)
            const beadIndex = visualIndex;
            const isActive = beadIndex < lowerCount;
            
            return (
              <AbacusBead
                key={beadIndex}
                isUpper={false}
                isActive={isActive}
                onActivate={() => handleLowerActivate(beadIndex)}
                onDeactivate={() => handleLowerDeactivate(beadIndex)}
                beadSize={beadSize}
                color={lowerBeadColor}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
      
      {/* Ustun qiymati (debug/beginner mode) */}
      {showLabel && (
        <motion.div 
          className="mt-2 text-center"
          key={columnValue}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <span className={cn(
            "inline-block min-w-[1.5rem] px-1.5 py-0.5 rounded-md",
            "text-sm sm:text-base font-bold",
            "bg-amber-900/50 text-amber-100",
            columnValue > 0 && "bg-primary/20 text-primary"
          )}>
            {columnValue}
          </span>
        </motion.div>
      )}
    </div>
  );
};
