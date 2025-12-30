import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Play, RotateCcw, Check, Settings2, Lightbulb, Eye, EyeOff, Clock, Star, Zap, Trophy } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AbacusFlashCardProps {
  onComplete?: (correct: number, total: number) => void;
}

// Interactive Abacus where user can click beads - Mobile Optimized
const InteractiveAbacus = ({ 
  value, 
  onChange, 
  disabled = false,
}: { 
  value: number; 
  onChange: (value: number) => void;
  disabled?: boolean;
}) => {
  const { playSound } = useSound();

  const topBeadActive = value >= 5;
  const bottomBeadsActive = value >= 5 ? value - 5 : value;

  const handleTopBeadClick = () => {
    if (disabled) return;
    playSound('bead');
    if (topBeadActive) {
      onChange(value - 5);
    } else {
      onChange(value + 5);
    }
  };

  const handleBottomBeadClick = (index: number) => {
    if (disabled) return;
    playSound('bead');
    const clickedPosition = 3 - index;
    const currentActive = bottomBeadsActive;
    
    if (clickedPosition < currentActive) {
      const newBase = topBeadActive ? 5 : 0;
      onChange(newBase + clickedPosition);
    } else {
      const newBase = topBeadActive ? 5 : 0;
      onChange(newBase + clickedPosition + 1);
    }
  };

  const renderBead = (isActive: boolean, isTop: boolean, onClick: () => void, key?: number) => {
    return (
      <button
        key={key}
        onClick={onClick}
        disabled={disabled}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 md:w-12 md:h-12
          rounded-full 
          transition-all duration-300 ease-out
          touch-manipulation
          ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}
          ${isActive
            ? `bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 
               shadow-[0_4px_12px_rgba(217,119,6,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)]`
            : `bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 
               shadow-[0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.5)]
               ${!disabled && 'hover:from-gray-300 hover:to-gray-500'}`
          }
        `}
        style={{
          transform: isActive 
            ? `translateY(${isTop ? '16px' : '-16px'})` 
            : 'translateY(0)',
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6">
      <div 
        className="
          bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 
          rounded-2xl p-4 sm:p-6 
          shadow-[0_8px_32px_rgba(217,119,6,0.2),inset_0_2px_8px_rgba(255,255,255,0.5)] 
          border-2 border-amber-300
        "
      >
        <div 
          className="
            bg-gradient-to-b from-amber-50 to-white 
            rounded-xl p-4 sm:p-5 
            shadow-inner
            border border-amber-200
          "
        >
          <div className="relative flex flex-col items-center">
            <div 
              className="
                absolute w-2.5 h-52 sm:h-56 md:h-48
                bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 
                rounded-full z-0
                shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]
              " 
            />
            
            <div className="flex flex-col gap-2 sm:gap-2.5 z-10 mb-4">
              {renderBead(topBeadActive, true, handleTopBeadClick)}
            </div>

            <div 
              className="w-20 sm:w-24 h-2.5 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded z-10 my-2 shadow-md" 
            />

            <div className="flex flex-col gap-2 sm:gap-2.5 z-10 mt-4">
              {[0, 1, 2, 3].map((index) => {
                const isActive = (3 - index) < bottomBeadsActive;
                return renderBead(isActive, false, () => handleBottomBeadClick(index), index);
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-4xl sm:text-5xl font-bold text-primary font-display">
        {value}
      </div>
    </div>
  );
};

// Qiyinlik darajalari
type DifficultyLevel = '1-digit' | '2-digit' | '3-digit';

const DIFFICULTY_CONFIG = {
  '1-digit': { label: "1 xonali", min: 0, max: 9, columns: 1 },
  '2-digit': { label: "2 xonali", min: 10, max: 99, columns: 2 },
  '3-digit': { label: "3 xonali", min: 100, max: 999, columns: 3 },
};

export const AbacusFlashCard = ({ onComplete }: AbacusFlashCardProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  // Settings
  const [problemCount, setProblemCount] = useState(5);
  const [showTime, setShowTime] = useState(2000);
  const [answerTimeLimit, setAnswerTimeLimit] = useState(10); // seconds to answer
  const [showSettings, setShowSettings] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('1-digit');
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(false);
  const [userValue, setUserValue] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0, totalPoints: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerStartTime, setAnswerStartTime] = useState<number | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate points based on time, streak, and difficulty
  const calculatePoints = useCallback((timeTaken: number, currentStreak: number) => {
    // Base points - higher for harder difficulties
    const difficultyMultiplier = difficulty === '3-digit' ? 3 : difficulty === '2-digit' ? 2 : 1;
    let points = 10 * difficultyMultiplier;
    
    // Time bonus: faster = more points (max 20 bonus points)
    const timeBonus = Math.max(0, Math.floor((answerTimeLimit - timeTaken) * 2));
    points += Math.min(timeBonus, 20);
    
    // Streak bonus: 5 points per streak level (max 25 bonus)
    const streakBonus = Math.min(currentStreak * 5, 25);
    points += streakBonus;
    
    return points;
  }, [answerTimeLimit, difficulty]);

  // Generate random number based on difficulty
  const generateNumber = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficulty];
    return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
  }, [difficulty]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Start answer timer countdown
  const startAnswerTimer = useCallback(() => {
    setTimeLeft(answerTimeLimit);
    setAnswerStartTime(Date.now());
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up!
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
    if (timeLeft === 0 && isPlaying && !showTarget && feedback === null && answerStartTime !== null) {
      // Time ran out
      handleTimeout();
    }
  }, [timeLeft, isPlaying, showTarget, feedback, answerStartTime]);

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
        nextProblem();
      }
    }, 1500);
  }, [score, currentProblem, problemCount, playSound, clearAllTimers]);

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
    
    playSound('start');
    
    const num = generateNumber();
    setTargetNumber(num);
    setShowTarget(true);
    setUserValue(0);
    
    timeoutRef.current = setTimeout(() => {
      setShowTarget(false);
      startAnswerTimer();
    }, showTime);
  }, [generateNumber, showTime, playSound, startAnswerTimer]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (targetNumber === null || feedback !== null) return;
    
    clearAllTimers();
    
    const timeTaken = answerStartTime ? (Date.now() - answerStartTime) / 1000 : answerTimeLimit;
    const isCorrect = userValue === targetNumber;
    
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
        nextProblem();
      }
    }, 1500);
  }, [targetNumber, userValue, score, currentProblem, problemCount, playSound, streak, bestStreak, answerStartTime, answerTimeLimit, calculatePoints, clearAllTimers, feedback]);

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

  // Next problem
  const nextProblem = useCallback(() => {
    setCurrentProblem(prev => prev + 1);
    setFeedback(null);
    setUserValue(0);
    setAnswerStartTime(null);
    
    const num = generateNumber();
    setTargetNumber(num);
    setShowTarget(true);
    
    timeoutRef.current = setTimeout(() => {
      setShowTarget(false);
      startAnswerTimer();
    }, showTime);
  }, [generateNumber, showTime, startAnswerTimer]);

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
      
      // Update profile
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
    setTargetNumber(null);
    setShowTarget(false);
    setUserValue(0);
    setFeedback(null);
    setScore({ correct: 0, incorrect: 0, totalPoints: 0 });
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(0);
    setAnswerStartTime(null);
  }, [clearAllTimers]);

  // Toggle show/hide target
  const toggleShowTarget = () => {
    setShowTarget(!showTarget);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const accuracy = score.correct + score.incorrect > 0
    ? Math.round((score.correct / (score.correct + score.incorrect)) * 100)
    : 0;

  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 3) return 'text-red-500';
    if (timeLeft <= 5) return 'text-amber-500';
    return 'text-green-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 pb-4 px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
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
                    <SelectItem value="1-digit" className="text-base sm:text-sm py-3 sm:py-2">
                      1 xonali (0-9)
                    </SelectItem>
                    <SelectItem value="2-digit" className="text-base sm:text-sm py-3 sm:py-2">
                      2 xonali (10-99)
                    </SelectItem>
                    <SelectItem value="3-digit" className="text-base sm:text-sm py-3 sm:py-2">
                      3 xonali (100-999)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Masalalar soni</Label>
                <Select value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                  <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-base sm:text-sm py-3 sm:py-2">5 ta</SelectItem>
                    <SelectItem value="10" className="text-base sm:text-sm py-3 sm:py-2">10 ta</SelectItem>
                    <SelectItem value="15" className="text-base sm:text-sm py-3 sm:py-2">15 ta</SelectItem>
                    <SelectItem value="20" className="text-base sm:text-sm py-3 sm:py-2">20 ta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Ko'rsatish vaqti</Label>
                  <Select value={String(showTime)} onValueChange={(v) => setShowTime(Number(v))}>
                    <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000" className="text-base sm:text-sm py-3 sm:py-2">1 son</SelectItem>
                      <SelectItem value="2000" className="text-base sm:text-sm py-3 sm:py-2">2 son</SelectItem>
                      <SelectItem value="3000" className="text-base sm:text-sm py-3 sm:py-2">3 son</SelectItem>
                      <SelectItem value="5000" className="text-base sm:text-sm py-3 sm:py-2">5 son</SelectItem>
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
                      <SelectItem value="5" className="text-base sm:text-sm py-3 sm:py-2">5 son</SelectItem>
                      <SelectItem value="10" className="text-base sm:text-sm py-3 sm:py-2">10 son</SelectItem>
                      <SelectItem value="15" className="text-base sm:text-sm py-3 sm:py-2">15 son</SelectItem>
                      <SelectItem value="20" className="text-base sm:text-sm py-3 sm:py-2">20 son</SelectItem>
                      <SelectItem value="30" className="text-base sm:text-sm py-3 sm:py-2">30 son</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Scoring info - Collapsible on mobile */}
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Star className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Ball tizimi</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                        <span>Asosiy: 10 ball</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>Vaqt bonusi: max +20</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-500 flex-shrink-0" />
                        <span>Seriya bonusi: max +25</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center pt-4">
              <Button onClick={startGame} size="lg" className="gap-2 h-14 sm:h-12 text-lg sm:text-base px-8 w-full sm:w-auto">
                <Play className="h-6 w-6 sm:h-5 sm:w-5" />
                Boshlash
              </Button>
            </div>
          </div>
        )}

        {/* Game area */}
        {isPlaying && (
          <div className="space-y-4 sm:space-y-6">
            {/* Progress and Stats - Mobile optimized */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-muted-foreground font-medium">
                  {currentProblem} / {problemCount}
                </span>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-1.5 text-amber-500">
                    <Star className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="font-bold text-base sm:text-sm">{score.totalPoints}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-green-500">
                    <Trophy className="h-5 w-5 sm:h-4 sm:w-4" />
                    <span className="font-medium text-base sm:text-sm">{streak}x</span>
                  </span>
                </div>
              </div>
              <Progress value={(currentProblem / problemCount) * 100} className="h-2.5 sm:h-2" />
            </div>

            {/* Timer display - Larger for mobile */}
            {!showTarget && feedback === null && (
              <div className="flex justify-center">
                <div className={`flex items-center gap-3 text-5xl sm:text-4xl font-bold ${getTimerColor()} transition-colors`}>
                  <Clock className="h-12 w-12 sm:h-8 sm:w-8" />
                  <span>{timeLeft}</span>
                </div>
              </div>
            )}

            {/* Target number display - Much larger for mobile */}
            <div className="text-center">
              {showTarget ? (
                <div className="space-y-3">
                  <p className="text-base sm:text-sm text-muted-foreground">Bu sonni yodlang:</p>
                  <div className="text-[120px] sm:text-8xl font-bold text-primary font-display animate-fade-in leading-none">
                    {targetNumber}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-base sm:text-sm text-muted-foreground">
                    Abacusda sonni joylashtiring:
                  </p>
                  <Button 
                    variant="ghost" 
                    size="default" 
                    onClick={toggleShowTarget}
                    className="gap-2 h-10 sm:h-8"
                  >
                    {showTarget ? <EyeOff className="h-5 w-5 sm:h-4 sm:w-4" /> : <Eye className="h-5 w-5 sm:h-4 sm:w-4" />}
                    {showTarget ? 'Yashirish' : "Ko'rsatish"}
                  </Button>
                </div>
              )}
            </div>

            {/* Interactive Abacus */}
            {!showTarget && (
              <div className="flex flex-col items-center">
                <InteractiveAbacus
                  value={userValue}
                  onChange={setUserValue}
                  disabled={feedback !== null}
                />
                
                {/* Feedback - Larger for mobile */}
                {feedback && (
                  <div className={`text-2xl sm:text-xl font-bold animate-fade-in text-center px-4 ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {feedback === 'correct' && "To'g'ri! ✓"}
                    {feedback === 'incorrect' && `Noto'g'ri. Javob: ${targetNumber}`}
                    {feedback === 'timeout' && `Vaqt tugadi! Javob: ${targetNumber}`}
                  </div>
                )}
                
                {/* Check button - Larger for mobile */}
                {!feedback && (
                  <Button onClick={checkAnswer} size="lg" className="gap-2 mt-4 h-14 sm:h-12 text-lg sm:text-base px-8 w-full sm:w-auto max-w-xs">
                    <Check className="h-6 w-6 sm:h-5 sm:w-5" />
                    Tekshirish
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results - Mobile optimized */}
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
            
            {/* Stats Grid - Larger on mobile */}
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
