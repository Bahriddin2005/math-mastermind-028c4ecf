import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageBackground } from "@/components/layout/PageBackground";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useGameCurrency } from "@/hooks/useGameCurrency";
import { useSound } from "@/hooks/useSound";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Coins, Heart, Star, X, 
  Check, Trophy, Home, RotateCcw, Zap,
  Lightbulb, Pause, Sparkles
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

interface PowerUp {
  id: string;
  item_id: string;
  name: string;
  icon: string;
  quantity: number;
  item_type: string;
}

type GameState = 'ready' | 'playing' | 'feedback' | 'finished' | 'failed' | 'paused';

const GamePlay = () => {
  const navigate = useNavigate();
  const { levelId } = useParams();
  const { user } = useAuth();
  const { coins, lives, useLife, addCoins } = useGameCurrency();
  const { playSound } = useSound();
  const { triggerLevelUpConfetti, triggerAchievementConfetti } = useConfetti();

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
  
  // Power-ups state
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [coinMultiplier, setCoinMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Animation states
  const [numberAnimation, setNumberAnimation] = useState<'enter' | 'exit' | 'idle'>('idle');
  const [scorePopup, setScorePopup] = useState<{ score: number; show: boolean }>({ score: 0, show: false });
  const [shakeInput, setShakeInput] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadLevel();
    loadPowerUps();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [levelId, user]);

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

  const loadPowerUps = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_inventory')
      .select(`
        id,
        item_id,
        quantity,
        shop_items (name, icon, item_type)
      `)
      .eq('user_id', user.id)
      .gt('quantity', 0);

    if (data) {
      const formattedPowerUps: PowerUp[] = data
        .filter((item: any) => item.shop_items?.item_type === 'consumable')
        .map((item: any) => ({
          id: item.id,
          item_id: item.item_id,
          name: item.shop_items.name,
          icon: item.shop_items.icon,
          quantity: item.quantity,
          item_type: item.shop_items.item_type
        }));
      setPowerUps(formattedPowerUps);
    }
  };

  const usePowerUp = async (powerUp: PowerUp) => {
    if (powerUp.quantity <= 0) return;

    // Update quantity in state
    setPowerUps(prev => prev.map(p => 
      p.id === powerUp.id ? { ...p, quantity: p.quantity - 1 } : p
    ));

    // Update in database
    await supabase
      .from('user_inventory')
      .update({ quantity: powerUp.quantity - 1 })
      .eq('id', powerUp.id);

    // Apply power-up effect
    if (powerUp.name.includes('2x coin')) {
      setCoinMultiplier(2);
      toast.success('2x coin faollashtirildi! 💰', { duration: 3000 });
      setTimeout(() => setCoinMultiplier(1), 60000); // 1 minute
    } else if (powerUp.name.includes("Vaqt to'xtatish")) {
      setIsPaused(true);
      toast.success("Vaqt to'xtatildi! ⏰", { duration: 3000 });
      setTimeout(() => setIsPaused(false), 5000); // 5 seconds
    } else if (powerUp.name.includes('Yordam')) {
      setShowHint(true);
      toast.success("To'g'ri javob ko'rsatildi! 💡", { duration: 3000 });
    }

    playSound('correct');
  };

  const generateProblem = useCallback(() => {
    if (!level) return;

    setNumberAnimation('exit');
    setShowHint(false);
    
    setTimeout(() => {
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

      if (total < 0) {
        nums[0] = Math.abs(nums[0]) + Math.abs(total) + 1;
        total = nums.reduce((a, b) => a + b, 0);
      }

      setNumbers(nums);
      setCorrectAnswer(total);
      setDisplayIndex(0);
      setUserAnswer('');
      setIsCorrect(null);
      setNumberAnimation('enter');
    }, 300);
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
    setCoinMultiplier(1);
    generateProblem();
  };

  // Display numbers one by one with animation
  useEffect(() => {
    if (gameState !== 'playing' || numbers.length === 0 || isPaused) return;

    if (displayIndex < numbers.length) {
      setNumberAnimation('enter');
      intervalRef.current = setTimeout(() => {
        setNumberAnimation('exit');
        setTimeout(() => {
          setDisplayIndex(prev => prev + 1);
          playSound('tick');
        }, 200);
      }, 600);
    } else {
      setStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [displayIndex, numbers, gameState, playSound, isPaused]);

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
      const problemScore = (100 + timeBonus + streakBonus) * coinMultiplier;
      
      setScore(prev => prev + problemScore);
      setStreak(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
      
      // Show score popup
      setScorePopup({ score: problemScore, show: true });
      setTimeout(() => setScorePopup({ score: 0, show: false }), 1000);
      
      if (streak >= 4) {
        triggerAchievementConfetti();
      }
    } else {
      playSound('incorrect');
      setStreak(0);
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
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

    const coinsEarned = stars > 0 ? Math.floor(level.coin_reward * (stars / 3) * 1.5 * coinMultiplier) : 0;

    setEarnedStars(stars);
    setEarnedCoins(coinsEarned);

    if (stars >= 2) {
      triggerLevelUpConfetti();
      playSound('complete');
    }

    try {
      const { data: existing } = await supabase
        .from('user_level_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('level_id', level.id)
        .maybeSingle();

      if (existing) {
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

      if (coinsEarned > 0) {
        await addCoins(coinsEarned);
      }

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
        className={`h-12 w-12 transition-all duration-700 ${
          i < count 
            ? 'fill-yellow-400 text-yellow-400 animate-bounce' 
            : 'text-muted-foreground/30'
        }`}
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.6s' }}
      />
    ));
  };

  if (!level) {
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
          </div>
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

          {(gameState === 'playing' || gameState === 'feedback') && (
            <div className="flex-1 mx-4">
              <Progress 
                value={(currentProblem / level.problem_count) * 100} 
                className="h-3 bg-muted/50"
              />
              <p className="text-xs text-center text-muted-foreground mt-1">
                {currentProblem + 1} / {level.problem_count}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {coinMultiplier > 1 && (
              <Badge className="bg-yellow-500 text-white animate-pulse">
                {coinMultiplier}x 💰
              </Badge>
            )}
            <div className="flex items-center gap-1.5 text-sm bg-red-500/10 px-2 py-1 rounded-full">
              <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              <span className="font-medium">{lives}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm bg-yellow-500/10 px-2 py-1 rounded-full">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{coins}</span>
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          {/* Ready State */}
          {gameState === 'ready' && (
            <Card className="w-full max-w-sm p-8 text-center space-y-6 animate-scale-in">
              <div className="text-7xl animate-bounce">{level.icon}</div>
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Level {level.level_number}
                </h2>
                <p className="text-muted-foreground text-lg">{level.name}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground bg-secondary/50 rounded-xl p-4">
                <p className="flex items-center justify-center gap-2">
                  <span className="text-lg">📝</span> {level.problem_count} ta masala
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" /> +{level.coin_reward} coin
                </p>
              </div>
              
              {/* Power-ups */}
              {powerUps.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Power-uplar:</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {powerUps.map(powerUp => (
                      <Button
                        key={powerUp.id}
                        variant="outline"
                        size="sm"
                        onClick={() => usePowerUp(powerUp)}
                        disabled={powerUp.quantity <= 0}
                        className="text-xs"
                      >
                        {powerUp.icon} x{powerUp.quantity}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={startGame}
                disabled={lives <= 0}
              >
                {lives > 0 ? (
                  <>
                    <Heart className="h-5 w-5 mr-2" />
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
            <div className="w-full max-w-sm space-y-6 relative">
              {/* Score Popup */}
              {scorePopup.show && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full animate-fade-in z-50">
                  <span className="text-2xl font-bold text-green-500 animate-bounce">
                    +{scorePopup.score}
                  </span>
                </div>
              )}

              {/* Score & Streak */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-purple-500/20 px-4 py-2 rounded-full border border-primary/30">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">{score}</span>
                </div>
                {streak > 0 && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    streak >= 5 ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 border-orange-500 animate-pulse' :
                    'bg-orange-500/10 border-orange-500/30'
                  }`}>
                    <Zap className={`h-5 w-5 ${streak >= 5 ? 'text-orange-400' : 'text-orange-500'}`} />
                    <span className={`font-bold ${streak >= 5 ? 'text-orange-400' : 'text-orange-600'}`}>
                      {streak}x {streak >= 5 ? '🔥' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Power-ups during game */}
              {powerUps.filter(p => p.quantity > 0).length > 0 && displayIndex >= numbers.length && gameState === 'playing' && (
                <div className="flex justify-center gap-2">
                  {powerUps.filter(p => p.quantity > 0).map(powerUp => (
                    <Button
                      key={powerUp.id}
                      variant="outline"
                      size="sm"
                      onClick={() => usePowerUp(powerUp)}
                      className="text-xs animate-pulse"
                    >
                      {powerUp.icon}
                    </Button>
                  ))}
                </div>
              )}

              {/* Number Display */}
              <Card className={`p-8 relative overflow-hidden ${isPaused ? 'ring-2 ring-blue-500' : ''}`}>
                {isPaused && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center z-10">
                    <Pause className="h-12 w-12 text-blue-500 animate-pulse" />
                  </div>
                )}
                
                <div className="h-40 flex items-center justify-center relative">
                  {displayIndex <= numbers.length && displayIndex > 0 ? (
                    <div className={`text-7xl font-bold transition-all duration-300 ${
                      numberAnimation === 'enter' ? 'animate-scale-in opacity-100' :
                      numberAnimation === 'exit' ? 'scale-50 opacity-0' : ''
                    } ${numbers[displayIndex - 1] > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {numbers[displayIndex - 1] > 0 ? '+' : ''}{numbers[displayIndex - 1]}
                    </div>
                  ) : displayIndex === 0 ? (
                    <div className="text-center space-y-2">
                      <div className="text-4xl animate-pulse">🎯</div>
                      <div className="text-xl text-muted-foreground animate-fade-in">Tayyor bo'ling...</div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 animate-fade-in">
                      <div className="text-3xl">🤔</div>
                      <div className="text-lg text-muted-foreground">Javobni kiriting</div>
                      {showHint && (
                        <div className="flex items-center justify-center gap-2 text-yellow-500 animate-pulse">
                          <Lightbulb className="h-5 w-5" />
                          <span className="font-bold">{correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Answer Input */}
              {displayIndex >= numbers.length && (
                <div className="space-y-4 animate-fade-in">
                  <Input
                    ref={inputRef}
                    type="number"
                    inputMode="numeric"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Javob"
                    className={`text-center text-4xl h-20 font-bold transition-all ${
                      isCorrect === true ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500' :
                      isCorrect === false ? 'border-red-500 bg-red-50 dark:bg-red-950 ring-2 ring-red-500' : 
                      'focus:ring-2 focus:ring-primary'
                    } ${shakeInput ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                    disabled={gameState === 'feedback'}
                  />

                  {gameState === 'feedback' && (
                    <div className={`text-center font-bold text-xl p-4 rounded-xl ${
                      isCorrect 
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/30' 
                        : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                    } animate-scale-in`}>
                      {isCorrect ? (
                        <div className="flex items-center justify-center gap-3">
                          <Check className="h-8 w-8" />
                          <span>To'g'ri! ✨</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <X className="h-6 w-6" />
                            <span>Noto'g'ri!</span>
                          </div>
                          <p className="text-lg">Javob: <span className="font-black">{correctAnswer}</span></p>
                        </div>
                      )}
                    </div>
                  )}

                  {gameState === 'playing' && (
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                      onClick={checkAnswer}
                      disabled={!userAnswer}
                    >
                      Tekshirish ✓
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Finished State */}
          {gameState === 'finished' && (
            <Card className="w-full max-w-sm p-8 text-center space-y-6 animate-scale-in">
              <div className="flex justify-center gap-3">
                {getStarsDisplay(earnedStars)}
              </div>

              <div className="space-y-2">
                <h2 className={`text-4xl font-bold ${
                  earnedStars === 3 ? 'text-yellow-500' : 
                  earnedStars === 2 ? 'text-emerald-500' : 
                  earnedStars === 1 ? 'text-blue-500' : 'text-muted-foreground'
                }`}>
                  {earnedStars === 3 ? "Ajoyib! 🎉" : 
                   earnedStars === 2 ? "Yaxshi! 👍" : 
                   earnedStars === 1 ? "Yomon emas 😊" : "Qayta urinib ko'ring 💪"}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {correctCount}/{level.problem_count} to'g'ri javob
                </p>
              </div>

              <div className="flex justify-center gap-8 text-xl bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <span className="font-bold">{score}</span>
                </div>
                {earnedCoins > 0 && (
                  <div className="flex items-center gap-2 animate-bounce">
                    <Coins className="h-6 w-6 text-yellow-500" />
                    <span className="font-bold text-yellow-600">+{earnedCoins}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => navigate('/game-hub')}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Ortga
                </Button>
                <Button 
                  className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  onClick={() => {
                    setGameState('ready');
                    setScore(0);
                  }}
                  disabled={lives <= 0}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Qayta
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>
    </PageBackground>
  );
};

export default GamePlay;
