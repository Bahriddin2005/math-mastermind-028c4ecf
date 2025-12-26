import { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Play, RotateCcw, Check, Settings2, Lightbulb, Eye, EyeOff } from 'lucide-react';
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
      // Deactivate: subtract 5
      onChange(value - 5);
    } else {
      // Activate: add 5
      onChange(value + 5);
    }
  };

  const handleBottomBeadClick = (index: number) => {
    if (disabled) return;
    playSound('bead');
    // Bottom beads: clicking activates/deactivates from bottom up
    const clickedPosition = 3 - index; // 0 = top bead, 3 = bottom bead
    const currentActive = bottomBeadsActive;
    
    if (clickedPosition < currentActive) {
      // Deactivate: set to clickedPosition
      const newBase = topBeadActive ? 5 : 0;
      onChange(newBase + clickedPosition);
    } else {
      // Activate: set to clickedPosition + 1
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
            {/* Rod */}
            <div 
              className={`
                absolute ${styles.rod} 
                bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 
                rounded-full z-0
                shadow-[inset_2px_0_4px_rgba(0,0,0,0.3)]
              `} 
            />
            
            {/* Top bead (5 value) */}
            <div className={`flex flex-col ${styles.gap} z-10 mb-4`}>
              {renderBead(topBeadActive, true, handleTopBeadClick)}
            </div>

            {/* Divider bar */}
            <div 
              className="w-16 h-2 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded z-10 my-2 shadow-md" 
            />

            {/* Bottom beads (1 value each) */}
            <div className={`flex flex-col ${styles.gap} z-10 mt-4`}>
              {[0, 1, 2, 3].map((index) => {
                const isActive = (3 - index) < bottomBeadsActive;
                return renderBead(isActive, false, () => handleBottomBeadClick(index), index);
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Current value display */}
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
  const [showTime, setShowTime] = useState(2000); // ms to show number
  const [showSettings, setShowSettings] = useState(true);
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  const [showTarget, setShowTarget] = useState(false);
  const [userValue, setUserValue] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [isFinished, setIsFinished] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random number 0-9
  const generateNumber = useCallback(() => {
    return Math.floor(Math.random() * 10);
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    setShowSettings(false);
    setCurrentProblem(1);
    setScore({ correct: 0, incorrect: 0 });
    setIsFinished(false);
    setFeedback(null);
    
    playSound('start');
    
    // Generate and show first number
    const num = generateNumber();
    setTargetNumber(num);
    setShowTarget(true);
    setUserValue(0);
    
    // Hide number after showTime
    timeoutRef.current = setTimeout(() => {
      setShowTarget(false);
    }, showTime);
  }, [generateNumber, showTime, playSound]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (targetNumber === null) return;
    
    const isCorrect = userValue === targetNumber;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    playSound(isCorrect ? 'correct' : 'incorrect');
    
    const newScore = {
      correct: score.correct + (isCorrect ? 1 : 0),
      incorrect: score.incorrect + (isCorrect ? 0 : 1),
    };
    setScore(newScore);
    
    // Show correct answer briefly
    setTimeout(() => {
      if (currentProblem >= problemCount) {
        // Game finished
        setIsFinished(true);
        setIsPlaying(false);
        playSound('complete');
        onComplete?.(newScore.correct, problemCount);
        
        // Save to database
        if (user) {
          saveResult(newScore);
        }
      } else {
        // Next problem
        nextProblem();
      }
    }, 1500);
  }, [targetNumber, userValue, score, currentProblem, problemCount, playSound, onComplete, user]);

  // Next problem
  const nextProblem = useCallback(() => {
    setCurrentProblem(prev => prev + 1);
    setFeedback(null);
    setUserValue(0);
    
    const num = generateNumber();
    setTargetNumber(num);
    setShowTarget(true);
    
    timeoutRef.current = setTimeout(() => {
      setShowTarget(false);
    }, showTime);
  }, [generateNumber, showTime]);

  // Save result to database
  const saveResult = async (finalScore: { correct: number; incorrect: number }) => {
    if (!user) return;
    
    try {
      await supabase.from('game_sessions').insert({
        user_id: user.id,
        section: 'mental-arithmetic',
        difficulty: 'flashcard',
        mode: 'flashcard',
        correct: finalScore.correct,
        incorrect: finalScore.incorrect,
        best_streak: finalScore.correct, // Simplified for flashcard mode
        score: finalScore.correct * 10,
        problems_solved: problemCount,
      });
      
      toast.success('Natija saqlandi!', { duration: 2000 });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Reset game
  const resetGame = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPlaying(false);
    setIsFinished(false);
    setShowSettings(true);
    setCurrentProblem(0);
    setTargetNumber(null);
    setShowTarget(false);
    setUserValue(0);
    setFeedback(null);
    setScore({ correct: 0, incorrect: 0 });
  }, []);

  // Toggle show/hide target
  const toggleShowTarget = () => {
    setShowTarget(!showTarget);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const accuracy = score.correct + score.incorrect > 0
    ? Math.round((score.correct / (score.correct + score.incorrect)) * 100)
    : 0;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
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
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Masala {currentProblem} / {problemCount}
                </span>
                <span className="text-green-500 font-medium">
                  {score.correct} to'g'ri
                </span>
              </div>
              <Progress value={(currentProblem / problemCount) * 100} className="h-2" />
            </div>

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
                  <div className={`text-2xl font-bold ${feedback === 'correct' ? 'text-green-500' : 'text-red-500'} animate-fade-in`}>
                    {feedback === 'correct' ? "To'g'ri! ✓" : `Noto'g'ri. Javob: ${targetNumber}`}
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
            <div className="text-6xl font-bold text-primary font-display">
              {score.correct} / {problemCount}
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
