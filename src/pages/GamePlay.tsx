import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageBackground } from "@/components/layout/PageBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useGameCurrency } from "@/hooks/useGameCurrency";
import { useSound } from "@/hooks/useSound";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Coins, Heart, Star, X, ArrowLeft, 
  Check, Trophy, Home, RotateCcw, Zap
} from "lucide-react";

interface GameLevel {
  id: string;
  level_number: number;
  name: string;
  description: string;
  coin_reward: number;
  difficulty: string;
  problem_count: number;
  time_limit: number | null;
  icon: string;
}

type GameState = 'ready' | 'playing' | 'feedback' | 'finished' | 'failed';

const GamePlay = () => {
  const navigate = useNavigate();
  const { levelId } = useParams();
  const { user } = useAuth();
  const { coins, lives, useLife, addCoins } = useGameCurrency();
  const { playSound } = useSound();
  const { triggerLevelUpConfetti } = useConfetti();

  const [level, setLevel] = useState<GameLevel | null>(null);
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentProblem, setCurrentProblem] = useState(0);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadLevel();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [levelId]);

  const loadLevel = async () => {
    if (!levelId) return;

    const { data } = await supabase
      .from('game_levels')
      .select('*')
      .eq('id', levelId)
      .single();

    if (data) {
      setLevel(data);
    }
  };

  const generateProblem = useCallback(() => {
    if (!level) return;

    const difficulty = level.difficulty;
    let maxNum = 9;
    let termCount = 3;

    switch (difficulty) {
      case 'easy':
        maxNum = 5;
        termCount = 3;
        break;
      case 'medium':
        maxNum = 9;
        termCount = 4;
        break;
      case 'hard':
        maxNum = 9;
        termCount = 5;
        break;
    }

    const nums: number[] = [];
    let total = 0;

    for (let i = 0; i < termCount; i++) {
      const num = Math.floor(Math.random() * maxNum) + 1;
      const isAdd = i === 0 || Math.random() > 0.3;
      
      if (isAdd) {
        nums.push(num);
        total += num;
      } else {
        nums.push(-num);
        total -= num;
      }
    }

    // Ensure positive result
    if (total < 0) {
      nums[0] = Math.abs(nums[0]) + Math.abs(total) + 1;
      total = nums.reduce((a, b) => a + b, 0);
    }

    setNumbers(nums);
    setCorrectAnswer(total);
    setDisplayIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
  }, [level]);

  const startGame = async () => {
    if (!user) {
      toast.error("O'ynash uchun tizimga kiring");
      navigate('/auth');
      return;
    }

    if (lives <= 0) {
      toast.error("Jonlar tugadi! Do'kondan sotib oling yoki kutib turing.");
      return;
    }

    // Use a life
    const success = await useLife();
    if (!success) {
      toast.error("Xatolik yuz berdi");
      return;
    }

    setGameState('playing');
    setCurrentProblem(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setEarnedCoins(0);
    generateProblem();
  };

  // Display numbers one by one
  useEffect(() => {
    if (gameState !== 'playing' || numbers.length === 0) return;

    if (displayIndex < numbers.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayIndex(prev => prev + 1);
        playSound('tick');
      }, 800);
    } else {
      // All numbers shown, focus input
      setStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [displayIndex, numbers, gameState, playSound]);

  const checkAnswer = () => {
    if (!level) return;

    const answer = parseInt(userAnswer);
    const correct = answer === correctAnswer;
    setIsCorrect(correct);
    setGameState('feedback');

    if (correct) {
      playSound('correct');
      const timeBonus = Math.max(0, 100 - Math.floor((Date.now() - startTime) / 100));
      const streakBonus = streak * 5;
      const problemScore = 100 + timeBonus + streakBonus;
      
      setScore(prev => prev + problemScore);
      setStreak(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
    } else {
      playSound('incorrect');
      setStreak(0);
    }

    setTimeout(() => {
      const nextProblem = currentProblem + 1;
      
      if (nextProblem >= level.problem_count) {
        finishGame();
      } else {
        setCurrentProblem(nextProblem);
        generateProblem();
        setGameState('playing');
      }
    }, correct ? 1000 : 2000);
  };

  const finishGame = async () => {
    if (!level || !user) return;

    const accuracy = (correctCount / level.problem_count) * 100;
    let stars = 0;

    if (accuracy >= 90) stars = 3;
    else if (accuracy >= 70) stars = 2;
    else if (accuracy >= 50) stars = 1;

    const coinsEarned = stars > 0 ? Math.floor(level.coin_reward * (stars / 3) * 1.5) : 0;

    setEarnedStars(stars);
    setEarnedCoins(coinsEarned);

    if (stars >= 2) {
      triggerLevelUpConfetti();
      playSound('complete');
    }

    // Save progress
    try {
      // Check if progress exists
      const { data: existing } = await supabase
        .from('user_level_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('level_id', level.id)
        .maybeSingle();

      if (existing) {
        // Update if better
        if (score > existing.best_score || stars > existing.stars_earned) {
          await supabase
            .from('user_level_progress')
            .update({
              stars_earned: Math.max(stars, existing.stars_earned),
              best_score: Math.max(score, existing.best_score),
              attempts: existing.attempts + 1,
              completed_at: stars > 0 ? new Date().toISOString() : existing.completed_at
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('user_level_progress')
            .update({ attempts: existing.attempts + 1 })
            .eq('id', existing.id);
        }
      } else {
        await supabase
          .from('user_level_progress')
          .insert({
            user_id: user.id,
            level_id: level.id,
            stars_earned: stars,
            best_score: score,
            attempts: 1,
            completed_at: stars > 0 ? new Date().toISOString() : null
          });
      }

      // Add coins
      if (coinsEarned > 0) {
        await addCoins(coinsEarned);
      }

      // Add XP to gamification
      const xpEarned = score;
      const { data: gamification } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (gamification) {
        await supabase
          .from('user_gamification')
          .update({
            total_xp: gamification.total_xp + xpEarned,
            current_xp: gamification.current_xp + xpEarned
          })
          .eq('user_id', user.id);
      }

    } catch (error) {
      console.error('Error saving progress:', error);
    }

    setGameState('finished');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer && displayIndex >= numbers.length) {
      checkAnswer();
    }
  };

  const getStarsDisplay = (count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-10 w-10 transition-all duration-500 ${
          i < count 
            ? 'fill-yellow-400 text-yellow-400 scale-110' 
            : 'text-muted-foreground/30'
        }`}
        style={{ animationDelay: `${i * 200}ms` }}
      />
    ));
  };

  if (!level) {
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b">
          <Button variant="ghost" size="icon" onClick={() => navigate('/game-hub')}>
            <X className="h-5 w-5" />
          </Button>

          {gameState === 'playing' && (
            <div className="flex-1 mx-4">
              <Progress 
                value={(currentProblem / level.problem_count) * 100} 
                className="h-2"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <span>{lives}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{coins}</span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Ready State */}
          {gameState === 'ready' && (
            <Card className="w-full max-w-sm p-8 text-center space-y-6">
              <div className="text-6xl">{level.icon}</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Level {level.level_number}</h2>
                <p className="text-muted-foreground">{level.name}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>📝 {level.problem_count} ta masala</p>
                <p>💰 +{level.coin_reward} coin</p>
              </div>
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={startGame}
                disabled={lives <= 0}
              >
                {lives > 0 ? (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    O'yinni boshlash (-1 ❤️)
                  </>
                ) : (
                  "Jonlar tugadi"
                )}
              </Button>
            </Card>
          )}

          {/* Playing State */}
          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className="w-full max-w-sm space-y-8">
              {/* Score & Streak */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-medium">{score}</span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full animate-pulse">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-600">{streak}x combo</span>
                  </div>
                )}
              </div>

              {/* Number Display */}
              <Card className="p-8">
                <div className="h-32 flex items-center justify-center">
                  {displayIndex <= numbers.length && displayIndex > 0 ? (
                    <div className="text-6xl font-bold text-primary animate-scale-in">
                      {numbers[displayIndex - 1] > 0 ? '+' : ''}{numbers[displayIndex - 1]}
                    </div>
                  ) : displayIndex === 0 ? (
                    <div className="text-2xl text-muted-foreground">Tayyor bo'ling...</div>
                  ) : (
                    <div className="text-xl text-muted-foreground">Javobni kiriting</div>
                  )}
                </div>
              </Card>

              {/* Answer Input */}
              {displayIndex >= numbers.length && (
                <div className="space-y-4">
                  <Input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Javob"
                    className={`text-center text-3xl h-16 font-bold ${
                      isCorrect === true ? 'border-green-500 bg-green-50 dark:bg-green-950' :
                      isCorrect === false ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''
                    }`}
                    disabled={gameState === 'feedback'}
                  />

                  {gameState === 'feedback' && (
                    <div className={`text-center font-bold text-lg ${
                      isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isCorrect ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-6 w-6" />
                          To'g'ri!
                        </div>
                      ) : (
                        <div>
                          <X className="h-6 w-6 inline mr-2" />
                          Noto'g'ri! Javob: {correctAnswer}
                        </div>
                      )}
                    </div>
                  )}

                  {gameState === 'playing' && (
                    <Button 
                      className="w-full h-12"
                      onClick={checkAnswer}
                      disabled={!userAnswer}
                    >
                      Tekshirish
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Finished State */}
          {gameState === 'finished' && (
            <Card className="w-full max-w-sm p-8 text-center space-y-6">
              <div className="flex justify-center gap-2">
                {getStarsDisplay(earnedStars)}
              </div>

              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {earnedStars === 3 ? "Zo'r!" : 
                   earnedStars === 2 ? "Yaxshi!" : 
                   earnedStars === 1 ? "Yomon emas" : "Qayta urinib ko'ring"}
                </h2>
                <p className="text-muted-foreground">
                  {correctCount}/{level.problem_count} to'g'ri javob
                </p>
              </div>

              <div className="flex justify-center gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-bold">{score}</span>
                </div>
                {earnedCoins > 0 && (
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-yellow-600">+{earnedCoins}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/game-hub')}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ortga
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={() => {
                    setGameState('ready');
                    setScore(0);
                  }}
                  disabled={lives <= 0}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Qayta
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageBackground>
  );
};

export default GamePlay;
