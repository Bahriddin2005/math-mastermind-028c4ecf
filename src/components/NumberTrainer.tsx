import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Square, Volume2, VolumeX, RotateCcw, Check } from 'lucide-react';

// Formulasiz qoidalar
const RULES_BASIC: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  1: { add: [1, 2, 3, 5, 6, 7, 8], subtract: [1] },
  2: { add: [1, 2, 5, 6, 7], subtract: [1, 2] },
  3: { add: [1, 5, 6], subtract: [1, 2, 3] },
  4: { add: [5], subtract: [1, 2, 3, 4] },
  5: { add: [1, 2, 3, 4], subtract: [5] },
  6: { add: [1, 2, 3], subtract: [1, 5, 6] },
  7: { add: [1, 2], subtract: [1, 2, 5, 7] },
  8: { add: [1], subtract: [1, 2, 3, 5, 8] },
  9: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

// Formula 5 (kichik do'stlar)
const RULES_FORMULA_5: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [], subtract: [] },
  2: { add: [], subtract: [] },
  3: { add: [2], subtract: [] },
  4: { add: [1, 2], subtract: [] },
  5: { add: [], subtract: [1, 2] },
  6: { add: [], subtract: [2] },
  7: { add: [], subtract: [] },
  8: { add: [], subtract: [] },
  9: { add: [], subtract: [] },
};

// Formula 10+ (katta do'stlar qo'shish)
const RULES_FORMULA_10_PLUS: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [] },
  1: { add: [9], subtract: [] },
  2: { add: [8, 9], subtract: [] },
  3: { add: [7, 8, 9], subtract: [] },
  4: { add: [6, 7, 8, 9], subtract: [] },
  5: { add: [5, 6, 7, 8, 9], subtract: [] },
  6: { add: [4, 5, 6, 7, 8, 9], subtract: [] },
  7: { add: [3, 4, 5, 6, 7, 8, 9], subtract: [] },
  8: { add: [2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
};

// Formula 10- (katta do'stlar ayirish)
const RULES_FORMULA_10_MINUS: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  1: { add: [], subtract: [2, 3, 4, 5, 6, 7, 8, 9] },
  2: { add: [], subtract: [3, 4, 5, 6, 7, 8, 9] },
  3: { add: [], subtract: [4, 5, 6, 7, 8, 9] },
  4: { add: [], subtract: [5, 6, 7, 8, 9] },
  5: { add: [], subtract: [6, 7, 8, 9] },
  6: { add: [], subtract: [7, 8, 9] },
  7: { add: [], subtract: [8, 9] },
  8: { add: [], subtract: [9] },
  9: { add: [], subtract: [] },
};

// Hammasi (aralash)
const RULES_ALL: Record<number, { add: number[]; subtract: number[] }> = {
  0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  1: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1] },
  2: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2] },
  3: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3] },
  4: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4] },
  5: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5] },
  6: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6] },
  7: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7] },
  8: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8] },
  9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
};

type FormulaType = 'oddiy' | 'formula5' | 'formula10plus' | 'formula10minus' | 'hammasi';

const FORMULA_RULES: Record<FormulaType, Record<number, { add: number[]; subtract: number[] }>> = {
  oddiy: RULES_BASIC,
  formula5: RULES_FORMULA_5,
  formula10plus: RULES_FORMULA_10_PLUS,
  formula10minus: RULES_FORMULA_10_MINUS,
  hammasi: RULES_ALL,
};

// Ovozli o'qish funksiyasi
const speakNumber = (number: string, isAddition: boolean, isFirst: boolean) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Oldingi ovozni to'xtatish
    
    let text = number;
    if (!isFirst) {
      text = isAddition ? `qo'sh ${number}` : `ayir ${number}`;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'uz-UZ'; // O'zbek tili
    utterance.rate = 1.2; // Tezroq gapirish
    utterance.pitch = 1;
    
    // Agar o'zbek tili topilmasa, rus tilida gapirish
    const voices = window.speechSynthesis.getVoices();
    const uzVoice = voices.find(v => v.lang.startsWith('uz'));
    const ruVoice = voices.find(v => v.lang.startsWith('ru'));
    
    if (uzVoice) {
      utterance.voice = uzVoice;
    } else if (ruVoice) {
      utterance.voice = ruVoice;
      // Rus tilida sonlarni aytish
      if (!isFirst) {
        utterance.text = isAddition ? `плюс ${number}` : `минус ${number}`;
      } else {
        utterance.text = number;
      }
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

export const NumberTrainer = () => {
  // Sozlamalar
  const [formulaType, setFormulaType] = useState<FormulaType>('oddiy');
  const [digitCount, setDigitCount] = useState(1);
  const [speed, setSpeed] = useState(0.5);
  const [problemCount, setProblemCount] = useState(5);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // O'yin holati
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentDisplay, setCurrentDisplay] = useState<string | null>(null);
  const [isAddition, setIsAddition] = useState(true);
  const [displayedNumbers, setDisplayedNumbers] = useState<{ num: string; isAdd: boolean }[]>([]);
  
  // Natija
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const runningResultRef = useRef(0);
  const countRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sonni generatsiya qilish
  const generateNextNumber = useCallback(() => {
    const currentResult = runningResultRef.current;
    const lastDigit = Math.abs(currentResult) % 10;
    const rules = FORMULA_RULES[formulaType][lastDigit];

    if (!rules) return null;

    const possibleOperations: { number: number; isAdd: boolean }[] = [];

    rules.add.forEach(num => {
      possibleOperations.push({ number: num, isAdd: true });
    });

    rules.subtract.forEach(num => {
      possibleOperations.push({ number: num, isAdd: false });
    });

    if (possibleOperations.length === 0) return null;

    const randomOp = possibleOperations[Math.floor(Math.random() * possibleOperations.length)];

    let finalNumber = randomOp.number;
    if (digitCount > 1) {
      const multiplier = Math.pow(10, Math.floor(Math.random() * digitCount));
      finalNumber = randomOp.number * Math.min(multiplier, Math.pow(10, digitCount - 1));
    }

    if (randomOp.isAdd) {
      runningResultRef.current += finalNumber;
    } else {
      runningResultRef.current -= finalNumber;
    }

    setIsAddition(randomOp.isAdd);
    return { num: finalNumber, isAdd: randomOp.isAdd };
  }, [formulaType, digitCount]);

  // O'yinni boshlash
  const startGame = useCallback(() => {
    const maxInitial = Math.pow(10, digitCount) - 1;
    const minInitial = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
    const initialResult = Math.floor(Math.random() * (maxInitial - minInitial + 1)) + minInitial;
    
    runningResultRef.current = initialResult;
    countRef.current = 1;

    setCurrentDisplay(String(initialResult));
    setDisplayedNumbers([{ num: String(initialResult), isAdd: true }]);
    setIsRunning(true);
    setIsFinished(false);
    setIsAddition(true);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);

    // Birinchi sonni o'qish
    if (voiceEnabled) {
      speakNumber(String(initialResult), true, true);
    }

    const speedMs = speed * 1000;

    intervalRef.current = setInterval(() => {
      countRef.current += 1;

      if (countRef.current > problemCount) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsFinished(true);
        setCurrentDisplay(null);
        return;
      }

      const result = generateNextNumber();
      if (result !== null) {
        setCurrentDisplay(String(result.num));
        setDisplayedNumbers(prev => [...prev, { num: String(result.num), isAdd: result.isAdd }]);
        
        // Sonni o'qish
        if (voiceEnabled) {
          speakNumber(String(result.num), result.isAdd, false);
        }
      }
    }, speedMs);
  }, [digitCount, speed, problemCount, generateNextNumber, voiceEnabled]);

  // To'xtatish
  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsRunning(false);
    setIsFinished(false);
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
  }, []);

  // Javobni tekshirish
  const checkAnswer = useCallback(() => {
    const userNum = parseInt(userAnswer, 10);
    const correctAnswer = runningResultRef.current;
    const correct = userNum === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  }, [userAnswer]);

  // Qayta boshlash
  const resetGame = useCallback(() => {
    setIsFinished(false);
    setCurrentDisplay(null);
    setDisplayedNumbers([]);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(null);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // O'yin davomida - faqat son ko'rsatish
  if (isRunning && currentDisplay !== null) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div 
          className="text-[180px] md:text-[250px] font-light text-foreground transition-all duration-100"
          key={countRef.current}
        >
          {!isAddition && countRef.current > 1 ? '-' : ''}{currentDisplay}
        </div>
        <div className="absolute bottom-10 flex gap-4">
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            onClick={stopGame}
            variant="destructive"
            size="lg"
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            To'xtatish
          </Button>
        </div>
      </div>
    );
  }

  // Natija sahifasi
  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Mashq tugadi!</h2>
          
          {/* Ko'rsatilgan sonlar */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Ko'rsatilgan sonlar:</p>
            <p className="text-lg font-mono">
              {displayedNumbers.map((item, i) => (
                <span key={i}>
                  {i > 0 ? (item.isAdd ? ' + ' : ' - ') : ''}{item.num}
                </span>
              ))}
            </p>
          </div>

          {!showResult ? (
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">Natijani kiriting:</p>
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                placeholder="Javob"
                className="text-center text-3xl h-16"
                autoFocus
              />
              <Button
                onClick={checkAnswer}
                disabled={!userAnswer}
                size="lg"
                className="w-full gap-2"
              >
                <Check className="h-5 w-5" />
                Tekshirish
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`text-6xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                {isCorrect ? '✓' : '✗'}
              </div>
              <div>
                <p className="text-lg">
                  {isCorrect ? "To'g'ri javob!" : "Noto'g'ri"}
                </p>
                <p className="text-3xl font-bold mt-2">
                  To'g'ri javob: {runningResultRef.current}
                </p>
                {!isCorrect && (
                  <p className="text-muted-foreground mt-1">
                    Sizning javobingiz: {userAnswer}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={resetGame}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RotateCcw className="h-5 w-5" />
              Orqaga
            </Button>
            <Button
              onClick={startGame}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              Yangi mashq
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sozlamalar sahifasi
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Test turini sozlang</h1>
        <Button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {voiceEnabled ? 'Ovoz yoqilgan' : 'Ovoz o\'chirilgan'}
        </Button>
      </div>

      {/* Misol turi */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Misol turi</Label>
        <RadioGroup
          value={formulaType}
          onValueChange={(v) => setFormulaType(v as FormulaType)}
          className="flex flex-wrap gap-2"
        >
          {[
            { value: 'oddiy', label: 'Oddiy' },
            { value: 'formula5', label: 'Formula 5' },
            { value: 'formula10plus', label: 'Formula 10+' },
            { value: 'formula10minus', label: 'Formula 10-' },
            { value: 'hammasi', label: 'hammasi' },
          ].map((item) => (
            <div key={item.value} className="flex items-center">
              <RadioGroupItem
                value={item.value}
                id={`formula-${item.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`formula-${item.value}`}
                className="flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formulaType === item.value ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                  {formulaType === item.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                {item.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Son xonasi */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Son xonasi</Label>
        <RadioGroup
          value={String(digitCount)}
          onValueChange={(v) => setDigitCount(Number(v))}
          className="flex flex-wrap gap-2"
        >
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <RadioGroupItem
                value={String(num)}
                id={`digit-${num}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`digit-${num}`}
                className="flex items-center gap-2 px-4 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted"
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${digitCount === num ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                  {digitCount === num && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                {num} xonali
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Tezligi */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Tezligi</Label>
        <RadioGroup
          value={String(speed)}
          onValueChange={(v) => setSpeed(Number(v))}
          className="flex flex-wrap gap-2"
        >
          {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((s) => (
            <div key={s} className="flex items-center">
              <RadioGroupItem
                value={String(s)}
                id={`speed-${s}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`speed-${s}`}
                className="flex items-center gap-2 px-3 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted text-sm"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${speed === s ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                  {speed === s && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                {s}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Misollar soni */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Misollar soni</Label>
        <RadioGroup
          value={String(problemCount)}
          onValueChange={(v) => setProblemCount(Number(v))}
          className="flex flex-wrap gap-2"
        >
          {Array.from({ length: 18 }, (_, i) => i + 3).map((num) => (
            <div key={num} className="flex items-center">
              <RadioGroupItem
                value={String(num)}
                id={`count-${num}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`count-${num}`}
                className="flex items-center gap-2 px-3 py-2 border rounded-full cursor-pointer transition-colors peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:border-primary hover:bg-muted text-sm"
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${problemCount === num ? 'border-primary-foreground bg-primary-foreground' : 'border-muted-foreground'}`}>
                  {problemCount === num && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
                {num}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Boshlash tugmasi */}
      <Button
        onClick={startGame}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white px-8"
      >
        Boshlash
      </Button>
    </div>
  );
};

export default NumberTrainer;
