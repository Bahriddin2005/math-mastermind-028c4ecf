import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Play, RotateCcw, Check, Settings2, Clock, Star, Trophy, Volume2, Square } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AbacusFlashCardProps {
  onComplete?: (correct: number, total: number) => void;
}

// Qiyinlik darajalari
type DifficultyLevel = '1-digit' | '2-digit' | '3-digit';

const DIFFICULTY_CONFIG = {
  '1-digit': { label: "1 xonali", min: 1, max: 9 },
  '2-digit': { label: "2 xonali", min: 10, max: 99 },
  '3-digit': { label: "3 xonali", min: 100, max: 999 },
};

export const AbacusFlashCard = ({ onComplete }: AbacusFlashCardProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  // Settings
  const [problemCount, setProblemCount] = useState(5);
  const [numberCount, setNumberCount] = useState(5); // Har bir masalada sonlar soni
  const [showTime, setShowTime] = useState(500); // ms - har bir son ko'rsatish vaqti
  const [answerTimeLimit, setAnswerTimeLimit] = useState(10); // seconds to answer
  const [showSettings, setShowSettings] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('1-digit');
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [displayNumbers, setDisplayNumbers] = useState<number[]>([]);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(-1);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [isDisplaying, setIsDisplaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, totalPoints: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate points based on time, streak, and difficulty
  const calculatePoints = useCallback((timeTaken: number, currentStreak: number) => {
    const difficultyMultiplier = difficulty === '3-digit' ? 3 : difficulty === '2-digit' ? 2 : 1;
    let points = 10 * difficultyMultiplier;
    
    const timeBonus = Math.max(0, Math.floor((answerTimeLimit - timeTaken) * 2));
    points += Math.min(timeBonus, 20);
    
    const streakBonus = Math.min(currentStreak * 5, 25);
    points += streakBonus;
    
    return points;
  }, [answerTimeLimit, difficulty]);

  // Generate all numbers for a problem with signs
  const generateProblemNumbers = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    const numbers: number[] = [];
    let runningTotal = 0;
    
    for (let i = 0; i < numberCount; i++) {
      const num = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
      
      if (i === 0) {
        // First number is always positive
        numbers.push(num);
        runningTotal = num;
      } else {
        // Subsequent numbers can be + or -
        const isPositive = Math.random() > 0.5;
        
        // Make sure result doesn't go too negative
        if (!isPositive && runningTotal < num) {
          numbers.push(num); // Force positive
          runningTotal += num;
        } else {
          numbers.push(isPositive ? num : -num);
          runningTotal += isPositive ? num : -num;
        }
      }
    }
    
    return { numbers, answer: runningTotal };
  }, [difficulty, numberCount]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
  }, []);

  // Start answer timer countdown
  const startAnswerTimer = useCallback(() => {
    setTimeLeft(answerTimeLimit);
    setAnswerStartTime(Date.now());
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [answerTimeLimit]);

  // Handle timeout
  useEffect(() => {
    if (timeLeft === 0 && isPlaying && !isDisplaying && feedback === null && answerStartTime !== null) {
      handleTimeout();
    }
  }, [timeLeft, isPlaying, isDisplaying, feedback, answerStartTime]);

  const handleTimeout = useCallback(() => {
    clearAllTimers();
    setFeedback('timeout');
    playSound('incorrect');
    setStreak(0);
    
    const newScore = {
      ...score,
      incorrect: score.incorrect + 1,
    };
    setScore(newScore);
    
    setTimeout(() => {
      if (currentProblem >= problemCount) {
        finishGame(newScore);
      } else {
        startNextProblem();
      }
    }, 2000);
  }, [score, currentProblem, problemCount, playSound, clearAllTimers]);

  // Display numbers one by one
  const displayNumbersSequentially = useCallback((numbers: number[], answer: number) => {
    setDisplayNumbers(numbers);
    setCorrectAnswer(answer);
    setCurrentDisplayIndex(0);
    setIsDisplaying(true);
    
    let index = 0;
    displayIntervalRef.current = setInterval(() => {
      index++;
      if (index >= numbers.length) {
        clearInterval(displayIntervalRef.current!);
        displayIntervalRef.current = null;
        
        // Short delay before showing input
        setTimeout(() => {
          setIsDisplaying(false);
          setCurrentDisplayIndex(-1);
          startAnswerTimer();
          inputRef.current?.focus();
        }, showTime);
      } else {
        setCurrentDisplayIndex(index);
      }
    }, showTime);
  }, [showTime, startAnswerTimer]);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setShowSettings(false);
    setCurrentProblem(1);
    setScore({ correct: 0, incorrect: 0, totalPoints: 0 });
    setIsFinished(false);
    setFeedback(null);
    setStreak(0);
    setBestStreak(0);
    setUserAnswer('');
    
    playSound('start');
    
    const { numbers, answer } = generateProblemNumbers();
    displayNumbersSequentially(numbers, answer);
  }, [generateProblemNumbers, displayNumbersSequentially, playSound]);

  // Start next problem
  const startNextProblem = useCallback(() => {
    setCurrentProblem(prev => prev + 1);
    setFeedback(null);
    setUserAnswer('');
    setAnswerStartTime(null);
    
    const { numbers, answer } = generateProblemNumbers();
    displayNumbersSequentially(numbers, answer);
  }, [generateProblemNumbers, displayNumbersSequentially]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (isDisplaying || feedback !== null) return;
    
    clearAllTimers();
    
    const userNum = parseInt(userAnswer, 10);
    const timeTaken = answerStartTime ? (Date.now() - answerStartTime) / 1000 : answerTimeLimit;
    const isCorrect = userNum === correctAnswer;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    let newStreak = streak;
    let points = 0;
    
    if (isCorrect) {
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }
      points = calculatePoints(timeTaken, newStreak);
    } else {
      newStreak = 0;
      setStreak(0);
    }
    
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      incorrect: score.incorrect + (isCorrect ? 0 : 1),
      totalPoints: score.totalPoints + points,
    };
    setScore(newScore);
    
    setTimeout(() => {
      if (currentProblem >= problemCount) {
        finishGame(newScore);
      } else {
        startNextProblem();
      }
    }, 2000);
  }, [isDisplaying, userAnswer, correctAnswer, score, currentProblem, problemCount, playSound, streak, bestStreak, answerStartTime, answerTimeLimit, calculatePoints, clearAllTimers, feedback, startNextProblem]);

  // Finish game
  const finishGame = useCallback((finalScore: { correct: number; incorrect: number; totalPoints: number }) => {
    setIsFinished(true);
    setIsPlaying(false);
    playSound('complete');
    onComplete?.(finalScore.correct, problemCount);
    
    if (user) {
      saveResult(finalScore);
    }
  }, [problemCount, playSound, onComplete, user]);

  // Save result to database
  const saveResult = async (finalScore: { correct: number; incorrect: number; totalPoints: number }) => {
    if (!user) return;
    
    try {
      await supabase.from('game_sessions').insert({
        user_id: user.id,
        section: 'mental-arithmetic',
        difficulty: 'flashcard',
        mode: 'flashcard',
        correct: finalScore.correct,
        incorrect: finalScore.incorrect,
        best_streak: bestStreak,
        score: finalScore.totalPoints,
        problems_solved: problemCount,
      });
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, total_problems_solved, best_streak')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_score: (profile.total_score || 0) + finalScore.totalPoints,
            total_problems_solved: (profile.total_problems_solved || 0) + problemCount,
            best_streak: Math.max(profile.best_streak || 0, bestStreak),
            last_active_date: new Date().toISOString().split('T')[0],
          })
          .eq('user_id', user.id);
      }
      
      toast.success('Natija saqlandi!', { duration: 2000 });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Reset game
  const resetGame = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setIsFinished(false);
    setShowSettings(true);
    setCurrentProblem(0);
    setDisplayNumbers([]);
    setCurrentDisplayIndex(-1);
    setIsDisplaying(false);
    setUserAnswer('');
    setFeedback(null);
    setScore({ correct: 0, incorrect: 0, totalPoints: 0 });
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(0);
    setAnswerStartTime(null);
  }, [clearAllTimers]);

  // Stop game
  const stopGame = useCallback(() => {
    clearAllTimers();
    setIsPlaying(false);
    setIsDisplaying(false);
    setShowSettings(true);
  }, [clearAllTimers]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisplaying && userAnswer && feedback === null) {
      checkAnswer();
    }
  };

  const accuracy = score.correct + score.incorrect > 0
    ? Math.round((score.correct / (score.correct + score.incorrect)) * 100)
    : 0;

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'text-red-500';
    if (timeLeft <= 5) return 'text-amber-500';
    return 'text-green-500';
  };

  // Format number with sign
  const formatNumberWithSign = (num: number, isFirst: boolean) => {
    if (isFirst) return num.toString();
    return num >= 0 ? `+${num}` : num.toString();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Star className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
          Flash Card Rejimi
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
        {/* Settings */}
        {showSettings && !isPlaying && !isFinished && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              Sozlamalar
            </div>
            <div className="grid grid-cols-1 gap-4">
              {/* Qiyinlik darajasi */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Qiyinlik darajasi</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-digit">1 xonali (1-9)</SelectItem>
                    <SelectItem value="2-digit">2 xonali (10-99)</SelectItem>
                    <SelectItem value="3-digit">3 xonali (100-999)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Masalalar soni</Label>
                  <Select value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                    <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 ta</SelectItem>
                      <SelectItem value="10">10 ta</SelectItem>
                      <SelectItem value="15">15 ta</SelectItem>
                      <SelectItem value="20">20 ta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Sonlar soni</Label>
                  <Select value={String(numberCount)} onValueChange={(v) => setNumberCount(Number(v))}>
                    <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ta</SelectItem>
                      <SelectItem value="5">5 ta</SelectItem>
                      <SelectItem value="7">7 ta</SelectItem>
                      <SelectItem value="10">10 ta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Son ko'rsatish vaqti</Label>
                  <Select value={String(showTime)} onValueChange={(v) => setShowTime(Number(v))}>
                    <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">0.3 son</SelectItem>
                      <SelectItem value="500">0.5 son</SelectItem>
                      <SelectItem value="700">0.7 son</SelectItem>
                      <SelectItem value="1000">1 son</SelectItem>
                      <SelectItem value="1500">1.5 son</SelectItem>
                      <SelectItem value="2000">2 son</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Javob vaqti</Label>
                  <Select value={String(answerTimeLimit)} onValueChange={(v) => setAnswerTimeLimit(Number(v))}>
                    <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 son</SelectItem>
                      <SelectItem value="10">10 son</SelectItem>
                      <SelectItem value="15">15 son</SelectItem>
                      <SelectItem value="20">20 son</SelectItem>
                      <SelectItem value="30">30 son</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={startGame} size="lg" className="gap-2 h-14 sm:h-12 text-lg sm:text-base px-8 w-full sm:w-auto">
                <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                Boshlash
              </Button>
            </div>
          </div>
        )}

        {/* Game area - Minimal Display */}
        {isPlaying && (
          <div className="space-y-6">
            {/* Top Stats Bar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Misol</span>
                <span className="text-lg font-bold">{currentProblem} / {problemCount}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                <Clock className={`h-4 w-4 ${!isDisplaying ? getTimerColor() : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">Vaqt</span>
                <span className={`text-lg font-bold ${!isDisplaying ? getTimerColor() : 'text-muted-foreground'}`}>
                  {isDisplaying ? '-' : `${timeLeft.toFixed(1)}s`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={(currentProblem / problemCount) * 100} className="h-2" />

            {/* Main Display Area - Clean minimal design */}
            <div className="min-h-[300px] sm:min-h-[400px] flex flex-col items-center justify-center relative">
              {isDisplaying && currentDisplayIndex >= 0 && currentDisplayIndex < displayNumbers.length && (
                <div className="text-center animate-fade-in flex flex-col items-center">
                  {/* Operation badge - shows above number */}
                  {currentDisplayIndex > 0 && (
                    <div className="mb-6 px-6 py-2 rounded-full bg-orange-50 border border-orange-200 inline-flex items-center gap-2">
                      <span className="text-orange-500 font-bold text-xl">
                        {displayNumbers[currentDisplayIndex] >= 0 ? '+' : '−'}
                      </span>
                      <span className="text-orange-500 font-medium text-lg">
                        {displayNumbers[currentDisplayIndex] >= 0 ? "Qo'shish" : "Ayirish"}
                      </span>
                    </div>
                  )}
                  
                  {/* Number display - always positive, sign shown in badge above */}
                  <div className="text-[120px] sm:text-[180px] font-bold font-display leading-none tracking-tight text-orange-500">
                    {Math.abs(displayNumbers[currentDisplayIndex])}
                  </div>
                </div>
              )}

              {/* Answer Input - Only show when not displaying */}
              {!isDisplaying && feedback === null && (
                <div className="text-center space-y-6 w-full max-w-md px-4">
                  <p className="text-lg text-muted-foreground">Javobingizni kiriting:</p>
                  <Input
                    ref={inputRef}
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="?"
                    className="text-center text-4xl sm:text-5xl font-bold h-20 sm:h-24"
                    autoFocus
                  />
                  <Button 
                    onClick={checkAnswer} 
                    size="lg" 
                    className="gap-2 h-14 text-lg px-8 w-full"
                    disabled={!userAnswer}
                  >
                    <Check className="h-6 w-6" />
                    Tekshirish
                  </Button>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="text-center space-y-4 animate-fade-in">
                  <div className={`text-[80px] sm:text-[120px] font-bold font-display leading-none ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {correctAnswer}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {feedback === 'correct' && "To'g'ri! ✓"}
                    {feedback === 'incorrect' && `Noto'g'ri. Javob: ${correctAnswer}`}
                    {feedback === 'timeout' && `Vaqt tugadi! Javob: ${correctAnswer}`}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" onClick={() => playSound('bead')} className="gap-2">
                <Volume2 className="h-5 w-5" />
              </Button>
              <Button variant="destructive" size="lg" onClick={stopGame} className="gap-2">
                <Square className="h-5 w-5" />
                To'xtatish
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isFinished && (
          <div className="text-center space-y-6 py-6 sm:py-8">
            {/* Total Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3 text-amber-500">
                <Star className="h-10 w-10 sm:h-8 sm:w-8" />
                <span className="text-6xl sm:text-5xl font-bold font-display">{score.totalPoints}</span>
              </div>
              <p className="text-base sm:text-sm text-muted-foreground">Jami ball</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-green-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-green-500">{score.correct}</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">To'g'ri</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-red-500">{score.incorrect}</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">Noto'g'ri</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 sm:p-4">
                <div className="text-3xl sm:text-2xl font-bold text-amber-500">{bestStreak}x</div>
                <div className="text-xs sm:text-xs text-muted-foreground mt-1">Seriya</div>
              </div>
            </div>
            
            <div className="text-lg sm:text-base text-muted-foreground">
              Aniqlik: <span className="text-blue-500 font-semibold">{accuracy}%</span>
            </div>
            
            <div className="flex justify-center px-4">
              <Button onClick={resetGame} variant="outline" className="gap-2 h-14 sm:h-10 text-lg sm:text-sm w-full sm:w-auto">
                <RotateCcw className="h-5 w-5 sm:h-4 sm:w-4" />
                Qayta boshlash
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AbacusFlashCard;
