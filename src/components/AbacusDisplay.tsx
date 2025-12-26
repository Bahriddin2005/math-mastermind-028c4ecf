import { useMemo } from 'react';

interface AbacusDisplayProps {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const AbacusDisplay = ({ number, size = 'md', showNumber = true }: AbacusDisplayProps) => {
  const sizeClasses = {
    sm: { bead: 'w-4 h-4', rod: 'w-1 h-20', gap: 'gap-0.5', container: 'p-2' },
    md: { bead: 'w-6 h-6', rod: 'w-1.5 h-28', gap: 'gap-1', container: 'p-4' },
    lg: { bead: 'w-8 h-8', rod: 'w-2 h-36', gap: 'gap-1.5', container: 'p-6' },
  };

  const styles = sizeClasses[size];

  // Soroban abacus: har bir ustunda 1 ta yuqori boncuk (5 qiymat), 4 ta pastki boncuk (1 qiymat)
  const renderColumn = (digit: number) => {
    // Yuqori boncuk (5 qiymat) - pastga tushgan = faol
    const topBeadActive = digit >= 5;
    // Pastki boncuklar (1 qiymat har biri)
    const bottomBeadsActive = digit >= 5 ? digit - 5 : digit;

    return (
      <div className="flex flex-col items-center relative">
        {/* Ustun (rod) */}
        <div className={`absolute ${styles.rod} bg-amber-800 rounded-full z-0`} />
        
        {/* Yuqori qism - 1 boncuk */}
        <div className={`flex flex-col ${styles.gap} z-10 mb-2`}>
          <div
            className={`${styles.bead} rounded-full transition-all duration-300 ${
              topBeadActive
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg translate-y-2'
                : 'bg-gradient-to-br from-gray-300 to-gray-400 shadow'
            }`}
          />
        </div>

        {/* Ajratuvchi chiziq */}
        <div className="w-full h-1 bg-amber-900 rounded z-10 my-1" />

        {/* Pastki qism - 4 boncuk */}
        <div className={`flex flex-col ${styles.gap} z-10 mt-2`}>
          {[0, 1, 2, 3].map((index) => {
            const isActive = index < bottomBeadsActive;
            return (
              <div
                key={index}
                className={`${styles.bead} rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg -translate-y-2'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400 shadow'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // Faqat bitta raqam (0-9) uchun
  const digit = Math.abs(number) % 10;

  return (
    <div className={`flex flex-col items-center ${styles.container}`}>
      <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-4 shadow-inner border-2 border-amber-300">
        <div className="bg-amber-50 rounded-lg p-3 shadow-inner">
          {renderColumn(digit)}
        </div>
      </div>
      {showNumber && (
        <div className="mt-4 text-4xl font-bold text-primary font-display">
          {number}
        </div>
      )}
    </div>
  );
};

export default AbacusDisplay;
