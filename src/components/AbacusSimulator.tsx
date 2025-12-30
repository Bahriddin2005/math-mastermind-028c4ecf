import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, RotateCcw, Check, Play, Shuffle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useSound } from '@/hooks/useSound';

interface BeadColumnProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  columnIndex: number;
}

const BeadColumn = ({ value, onChange, disabled, showValue, columnIndex }: BeadColumnProps) => {
  const { playSound } = useSound();
  
  // Soroban: yuqori donalar (5 lik) va pastki donalar (1 lik)
  const upperBeadActive = value >= 5;
  const lowerBeadsActive = value % 5;
  
  const handleUpperBeadClick = () => {
    if (disabled) return;
    playSound('bead');
    const newValue = upperBeadActive ? value - 5 : value + 5;
    if (newValue >= 0 && newValue <= 9) {
      onChange(newValue);
    }
  };
  
  const handleLowerBeadClick = (beadIndex: number) => {
    if (disabled) return;
    playSound('bead');
    const currentLower = value % 5;
    const upperValue = upperBeadActive ? 5 : 0;
    
    if (beadIndex < currentLower) {
      // Pastga tushirish
      onChange(upperValue + beadIndex);
    } else {
      // Yuqoriga ko'tarish
      onChange(upperValue + beadIndex + 1);
    }
  };
  
  // Ustun nomlari
  const columnLabels = ['1', '10', '100', '1000', '10K', '100K', '1M', '10M', '100M', '1B', '10B', '100B', '1T'];
  
  return (
    <div className="flex flex-col items-center">
      {/* Qiymat ko'rsatish */}
      {showValue && (
        <div className="text-lg font-bold text-primary mb-1">{value}</div>
      )}
      
      {/* Ustun */}
      <div className="relative w-8 sm:w-10 md:w-12">
        {/* Abacus ramkasi */}
        <div className="bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg p-1 shadow-lg">
          {/* Yuqori qism - 5 lik dona */}
          <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-t-md pb-1">
            {/* Tayoq */}
            <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-amber-600 to-amber-800 h-[45px] top-1 rounded-full z-0" />
            
            {/* 5-lik dona */}
            <div 
              className={`relative z-10 mx-auto cursor-pointer transition-all duration-200 ${
                upperBeadActive 
                  ? 'mt-5' // Pastga tushgan
                  : 'mt-1' // Yuqorida
              }`}
              onClick={handleUpperBeadClick}
            >
              <div className={`w-6 sm:w-8 md:w-10 h-4 sm:h-5 md:h-6 rounded-full shadow-md mx-auto transition-colors ${
                upperBeadActive 
                  ? 'bg-gradient-to-b from-red-400 via-red-500 to-red-600 shadow-red-500/30' 
                  : 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400'
              }`}>
                <div className="absolute inset-x-2 top-1 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Ajratuvchi chiziq */}
          <div className="h-2 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10" />
          </div>
          
          {/* Pastki qism - 1 lik donalar */}
          <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-b-md pt-1 relative">
            {/* Tayoq */}
            <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-amber-600 to-amber-800 h-[100px] top-1 rounded-full z-0" />
            
            <div className="flex flex-col items-center gap-0.5 py-1">
              {[0, 1, 2, 3].map((beadIndex) => {
                // Dona faol bo'lsa - yuqoriga ko'tarilgan
                const isActive = beadIndex < lowerBeadsActive;
                
                return (
                  <div
                    key={beadIndex}
                    className={`relative z-10 cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? beadIndex === 0 ? 'mt-0' : ''
                        : beadIndex === lowerBeadsActive ? 'mt-4' : ''
                    }`}
                    onClick={() => handleLowerBeadClick(beadIndex)}
                  >
                    <div className={`w-6 sm:w-8 md:w-10 h-4 sm:h-5 md:h-6 rounded-full shadow-md transition-colors ${
                      isActive 
                        ? 'bg-gradient-to-b from-red-400 via-red-500 to-red-600 shadow-red-500/30' 
                        : 'bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400'
                    }`}>
                      <div className="absolute inset-x-2 top-1 h-1 bg-white/40 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Ustun nomi */}
        <div className="text-[10px] text-muted-foreground text-center mt-1">{columnLabels[columnIndex]}</div>
      </div>
    </div>
  );
};

export const AbacusSimulator = () => {
  const { playSound } = useSound();
  const [columns, setColumns] = useState(7); // Ustunlar soni
  const [values, setValues] = useState<number[]>(Array(13).fill(0));
  const [showValues, setShowValues] = useState(true);
  
  // O'yin holati
  const [gameMode, setGameMode] = useState<'free' | 'guess' | 'set'>('free');
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [userGuess, setUserGuess] = useState('');
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1000);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Hisoblash
  const currentValue = values.slice(0, columns).reduce((sum, val, idx) => {
    return sum + val * Math.pow(10, columns - 1 - idx);
  }, 0);
  
  const handleColumnChange = (index: number, value: number) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
  };
  
  const resetAbacus = () => {
    setValues(Array(13).fill(0));
    playSound('tick');
  };
  
  const randomizeAbacus = () => {
    const newValues = Array(13).fill(0).map(() => Math.floor(Math.random() * 10));
    setValues(newValues);
    playSound('start');
  };
  
  // Sonni abakusda ko'rsatish
  const setNumberOnAbacus = (num: number) => {
    const newValues = Array(13).fill(0);
    const numStr = num.toString().padStart(columns, '0');
    for (let i = 0; i < columns && i < numStr.length; i++) {
      newValues[i] = parseInt(numStr[numStr.length - columns + i]) || 0;
    }
    setValues(newValues);
  };
  
  // O'yinni boshlash - "Topish" rejimi
  const startGuessGame = () => {
    const num = Math.floor(Math.random() * (rangeTo - rangeFrom + 1)) + rangeFrom;
    setNumberOnAbacus(num);
    setTargetNumber(num);
    setShowValues(false);
    setIsPlaying(true);
    setUserGuess('');
    setGameMode('guess');
    playSound('start');
    toast.info('Abakusdagi sonni toping!');
  };
  
  // O'yinni boshlash - "Qo'yish" rejimi
  const startSetGame = () => {
    const num = Math.floor(Math.random() * (rangeTo - rangeFrom + 1)) + rangeFrom;
    resetAbacus();
    setTargetNumber(num);
    setShowValues(true);
    setIsPlaying(true);
    setGameMode('set');
    playSound('start');
    toast.info(`${num} sonini abakusda qo'ying!`);
  };
  
  // Javobni tekshirish
  const checkGuessAnswer = () => {
    if (!targetNumber) return;
    
    const guess = parseInt(userGuess);
    setAttempts(prev => prev + 1);
    
    if (guess === targetNumber) {
      playSound('correct');
      setScore(prev => prev + 1);
      toast.success("To'g'ri! 🎉");
      setShowValues(true);
      setIsPlaying(false);
    } else {
      playSound('incorrect');
      toast.error(`Noto'g'ri. To'g'ri javob: ${targetNumber}`);
      setShowValues(true);
      setIsPlaying(false);
    }
  };
  
  const checkSetAnswer = () => {
    if (!targetNumber) return;
    
    setAttempts(prev => prev + 1);
    
    if (currentValue === targetNumber) {
      playSound('correct');
      setScore(prev => prev + 1);
      toast.success("To'g'ri! 🎉");
      setIsPlaying(false);
    } else {
      playSound('incorrect');
      toast.error(`Noto'g'ri. Siz qo'ygan: ${currentValue}, to'g'ri: ${targetNumber}`);
      setIsPlaying(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isPlaying && gameMode === 'guess' && userGuess) {
      checkGuessAnswer();
    }
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-amber-600" />
          Abacus Simulyator
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Sozlamalar */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Ustunlar:</Label>
            <Select value={String(columns)} onValueChange={(v) => setColumns(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 7, 9, 11, 13].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="sm" onClick={resetAbacus} className="gap-1">
            <RotateCcw className="h-4 w-4" />
            Tozalash
          </Button>
          
          <Button variant="outline" size="sm" onClick={randomizeAbacus} className="gap-1">
            <Shuffle className="h-4 w-4" />
            Tasodifiy
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowValues(!showValues)} 
            className="gap-1"
          >
            {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showValues ? "Yashirish" : "Ko'rsatish"}
          </Button>
        </div>
        
        {/* Qiymat ko'rsatish */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            {showValues ? currentValue.toLocaleString() : '???'}
          </div>
        </div>
        
        {/* Abakus */}
        <div className="overflow-x-auto pb-4">
          <div className="flex justify-center gap-1 sm:gap-2 min-w-max p-4 bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 rounded-xl shadow-2xl">
            {/* Chap ramka */}
            <div className="w-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded-l-full shadow-inner" />
            
            {/* Ustunlar */}
            {Array.from({ length: columns }, (_, idx) => (
              <BeadColumn
                key={idx}
                value={values[idx]}
                onChange={(value) => handleColumnChange(idx, value)}
                disabled={isPlaying && gameMode === 'guess'}
                showValue={false}
                columnIndex={columns - 1 - idx}
              />
            ))}
            
            {/* O'ng ramka */}
            <div className="w-3 bg-gradient-to-l from-amber-600 to-amber-700 rounded-r-full shadow-inner" />
          </div>
        </div>
        
        {/* O'yin sozlamalari */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Dan:</Label>
            <Input 
              type="number" 
              value={rangeFrom} 
              onChange={(e) => setRangeFrom(Number(e.target.value))}
              className="w-24"
              min={0}
            />
            <Label className="text-sm whitespace-nowrap">Gacha:</Label>
            <Input 
              type="number" 
              value={rangeTo} 
              onChange={(e) => setRangeTo(Number(e.target.value))}
              className="w-24"
              min={rangeFrom}
            />
          </div>
          
          <div className="flex items-center gap-4 justify-end">
            <div className="text-sm">
              <span className="text-muted-foreground">Ball: </span>
              <span className="font-bold text-primary">{score}</span>
              <span className="text-muted-foreground"> / {attempts}</span>
            </div>
          </div>
        </div>
        
        {/* O'yin tugmalari */}
        {!isPlaying ? (
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={startGuessGame} className="gap-2" variant="default">
              <Play className="h-4 w-4" />
              Sonni topish
            </Button>
            <Button onClick={startSetGame} className="gap-2" variant="secondary">
              <Play className="h-4 w-4" />
              Sonni qo'yish
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {gameMode === 'guess' && (
              <div className="flex items-center justify-center gap-3">
                <Input
                  type="number"
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Javobingiz"
                  className="w-40 text-center text-lg"
                  autoFocus
                />
                <Button onClick={checkGuessAnswer} disabled={!userGuess} className="gap-2">
                  <Check className="h-4 w-4" />
                  Tekshirish
                </Button>
              </div>
            )}
            
            {gameMode === 'set' && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg">
                  Qo'yilishi kerak: <span className="font-bold text-primary text-2xl">{targetNumber?.toLocaleString()}</span>
                </p>
                <Button onClick={checkSetAnswer} className="gap-2">
                  <Check className="h-4 w-4" />
                  Tekshirish
                </Button>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => { setIsPlaying(false); setShowValues(true); }}
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AbacusSimulator;
