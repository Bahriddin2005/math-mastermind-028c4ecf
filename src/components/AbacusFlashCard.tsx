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

// Interactive Abacus where user can click beads
const InteractiveAbacus = ({ 
  value, 
  onChange, 
  size = 'lg',
  disabled = false,
}: { 
  value: number; 
  onChange: (value: number) => void;
  size?: 'md' | 'lg';
  disabled?: boolean;
}) => {
  const { playSound } = useSound();
  
  const sizeClasses = {
    md: { 
      bead: 'w-8 h-8', 
      rod: 'w-1.5 h-36', 
      gap: 'gap-1.5',
    },
    lg: { 
      bead: 'w-10 h-10', 
      rod: 'w-2 h-44', 
      gap: 'gap-2',
    },
  };

  const styles = sizeClasses[size];

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
          ${styles.bead} 
          rounded-full 
          transition-all duration-300 ease-out
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
            ? `translateY(${isTop ? '14px' : '-14px'})` 
            : 'translateY(0)',
        }}
      />
    );
  };

  return (
    <div className="flex flex-col items-center p-6">
      <div 
        className="
          bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100 
          rounded-2xl p-6 
          shadow-[0_8px_32px_rgba(217,119,6,0.2),inset_0_2px_8px_rgba(255,255,255,0.5)] 
          border-2 border-amber-300
        "
      >
        <div 
          className="
            bg-gradient-to-b from-amber-50 to-white 
            rounded-xl p-5 
            shadow-inner
            border border-amber-200
          "
        >
          <div className="relative flex flex-col items-center">
            <div 
              className={`
                absolute ${styles.rod} 
                bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 
                rounded-full z-0
                shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]
              `} 
            />
            
            <div className={`flex flex-col ${styles.gap} z-10 mb-4`}>
              {renderBead(topBeadActive, true, handleTopBeadClick)}
            </div>

            <div 
              className="w-16 h-2 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded z-10 my-2 shadow-md" 
            />

            <div className={`flex flex-col ${styles.gap} z-10 mt-4`}>
              {[0, 1, 2, 3].map((index) => {
                const isActive = (3 - index) < bottomBeadsActive;
                return renderBead(isActive, false, () => handleBottomBeadClick(index), index);
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-3xl font-bold text-primary font-display">
        {value}
      </div>
    </div>
  );
};

export const AbacusFlashCard = ({ onComplete }: AbacusFlashCardProps) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  
  // Settings
  const [problemCount, setProblemCount] = useState(5);
  const [showTime, setShowTime] = useState(2000);
  const [answerTimeLimit, setAnswerTimeLimit] = useState(10); // seconds to answer
  const [showSettings, setShowSettings] = useState(true);
  
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

  // Calculate points based on time and streak
  const calculatePoints = useCallback((timeTaken: number, currentStreak: number) => {
    // Base points
    let points = 10;
    
    // Time bonus: faster = more points (max 20 bonus points)
    const timeBonus = Math.max(0, Math.floor((answerTimeLimit - timeTaken) * 2));
    points += Math.min(timeBonus, 20);
    
    // Streak bonus: 5 points per streak level (max 25 bonus)
    const streakBonus = Math.min(currentStreak * 5, 25);
    points += streakBonus;
    
    return points;
  }, [answerTimeLimit]);

  // Generate random number 0-9
  const generateNumber = useCallback(() => {
    return Math.floor(Math.random() * 10);
  }, []);

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
      <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Flash Card Rejimi
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Settings */}
        {showSettings && !isPlaying && !isFinished && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              Sozlamalar
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Masalalar soni</Label>
                <Select value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                  <SelectTrigger>
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
                <Label>Ko'rsatish vaqti</Label>
                <Select value={String(showTime)} onValueChange={(v) => setShowTime(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1000">1 soniya</SelectItem>
                    <SelectItem value="2000">2 soniya</SelectItem>
                    <SelectItem value="3000">3 soniya</SelectItem>
                    <SelectItem value="5000">5 soniya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Javob vaqti chegarasi</Label>
                <Select value={String(answerTimeLimit)} onValueChange={(v) => setAnswerTimeLimit(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 soniya</SelectItem>
                    <SelectItem value="10">10 soniya</SelectItem>
                    <SelectItem value="15">15 soniya</SelectItem>
                    <SelectItem value="20">20 soniya</SelectItem>
                    <SelectItem value="30">30 soniya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Scoring info */}
            <Card className="bg-muted/50 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">Ball tizimi</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" />
                        Asosiy ball: 10 ball har bir to'g'ri javob uchun
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-green-500" />
                        Vaqt bonusi: Tezroq javob = ko'proq ball (max +20)
                      </li>
                      <li className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        Seriya bonusi: Ketma-ket to'g'ri javoblar uchun +5 ball (max +25)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center pt-4">
              <Button onClick={startGame} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Boshlash
              </Button>
            </div>
          </div>
        )}

        {/* Game area */}
        {isPlaying && (
          <div className="space-y-6">
            {/* Progress and Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Masala {currentProblem} / {problemCount}
                </span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4" />
                    <span className="font-bold">{score.totalPoints}</span>
                  </span>
                  <span className="flex items-center gap-1 text-green-500">
                    <Trophy className="h-4 w-4" />
                    <span className="font-medium">{streak}x</span>
                  </span>
                </div>
              </div>
              <Progress value={(currentProblem / problemCount) * 100} className="h-2" />
            </div>

            {/* Timer display (only when answering) */}
            {!showTarget && feedback === null && (
              <div className="flex justify-center">
                <div className={`flex items-center gap-2 text-3xl font-bold ${getTimerColor()} transition-colors`}>
                  <Clock className="h-8 w-8" />
                  <span>{timeLeft}</span>
                </div>
              </div>
            )}

            {/* Target number display */}
            <div className="text-center">
              {showTarget ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Bu sonni yodlang:</p>
                  <div className="text-8xl font-bold text-primary font-display animate-fade-in">
                    {targetNumber}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Abacusda {targetNumber !== null ? 'sonni' : ''} joylashtiring:
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleShowTarget}
                    className="gap-1"
                  >
                    {showTarget ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                
                {/* Feedback */}
                {feedback && (
                  <div className={`text-2xl font-bold animate-fade-in ${
                    feedback === 'correct' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {feedback === 'correct' && "To'g'ri! ✓"}
                    {feedback === 'incorrect' && `Noto'g'ri. Javob: ${targetNumber}`}
                    {feedback === 'timeout' && `Vaqt tugadi! Javob: ${targetNumber}`}
                  </div>
                )}
                
                {/* Check button */}
                {!feedback && (
                  <Button onClick={checkAnswer} size="lg" className="gap-2 mt-4">
                    <Check className="h-5 w-5" />
                    Tekshirish
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isFinished && (
          <div className="text-center space-y-6 py-8">
            {/* Total Points */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <Star className="h-8 w-8" />
                <span className="text-5xl font-bold font-display">{score.totalPoints}</span>
              </div>
              <p className="text-muted-foreground">Jami ball</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-500">{score.correct}</div>
                <div className="text-xs text-muted-foreground">To'g'ri</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-500">{score.incorrect}</div>
                <div className="text-xs text-muted-foreground">Noto'g'ri</div>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-amber-500">{bestStreak}x</div>
                <div className="text-xs text-muted-foreground">Eng uzun seriya</div>
              </div>
            </div>
            
            <div className="text-lg text-muted-foreground">
              Aniqlik: <span className="text-blue-500 font-semibold">{accuracy}%</span>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={resetGame} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
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
