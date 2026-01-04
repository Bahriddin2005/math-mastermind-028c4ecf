import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageBackground } from '@/components/layout/PageBackground';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSound } from "@/hooks/useSound";
import { useConfetti } from "@/hooks/useConfetti";
import { useAdaptiveGamification } from "@/hooks/useAdaptiveGamification";
import { GamificationDisplay } from "@/components/GamificationDisplay";
import { Trophy, Play, Clock, Target, ArrowLeft, Check, X, Loader2, Award } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, differenceInHours } from "date-fns";

interface WeeklyChallenge {
  id: string;
  week_start: string;
  week_end: string;
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  seed: number;
}

interface GameState {
  status: "idle" | "countdown" | "playing" | "showing" | "input" | "result" | "finished";
  currentProblem: number;
  numbers: number[];
  currentNumberIndex: number;
  answer: string;
  correctAnswer: number;
  results: { correct: boolean; answer: number; userAnswer: number | null; time: number }[];
  startTime: number;
}

// Seeded random number generator
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate number based on formula type and digit count
const generateNumber = (formulaType: string, digitCount: number, seed: number, index: number): number => {
  const random = seededRandom(seed + index * 1000);
  const maxNum = Math.pow(10, digitCount) - 1;
  const minNum = digitCount === 1 ? 1 : Math.pow(10, digitCount - 1);
  
  let num = Math.floor(random * (maxNum - minNum + 1)) + minNum;
  
  // Determine if positive or negative based on formula type
  if (formulaType === "oddiy" || index === 0) {
    return num;
  }
  
  const signRandom = seededRandom(seed + index * 500);
  if (signRandom > 0.5) {
    return -num;
  }
  return num;
};

const WeeklyGame = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { soundEnabled, toggleSound, playSound } = useSound();
  const { triggerAchievementConfetti } = useConfetti();
  const inputRef = useRef<HTMLInputElement>(null);

  // Adaptive Gamification hook
  const gamification = useAdaptiveGamification({
    gameType: 'weekly-challenge',
    baseScore: 20,
    enabled: !!user,
  });

  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [gameState, setGameState] = useState<GameState>({
    status: "idle",
    currentProblem: 0,
    numbers: [],
    currentNumberIndex: 0,
    answer: "",
    correctAnswer: 0,
    results: [],
    startTime: 0,
  });

  // Fetch user profile
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  // Get current week's challenge
  const { data: challenge, isLoading } = useQuery({
    queryKey: ["weekly-challenge-game"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .lte("week_start", today)
        .gte("week_end", today)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as WeeklyChallenge | null;
    },
  });

  // Get user's current result
  const { data: userResult } = useQuery({
    queryKey: ["user-weekly-result-game", challenge?.id, user?.id],
    queryFn: async () => {
      if (!challenge || !user) return null;
      const { data, error } = await supabase
        .from("weekly_challenge_results")
        .select("*")
        .eq("challenge_id", challenge.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!challenge && !!user,
  });

  // Submit result mutation
  const submitResultMutation = useMutation({
    mutationFn: async (result: { score: number; correct: number; time: number }) => {
      if (!challenge || !user || !profile) throw new Error("Missing data");

      if (userResult) {
        const { error } = await supabase
          .from("weekly_challenge_results")
          .update({
            total_score: userResult.total_score + result.score,
            games_played: userResult.games_played + 1,
            correct_answers: userResult.correct_answers + result.correct,
            best_time: userResult.best_time
              ? Math.min(userResult.best_time, result.time)
              : result.time,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userResult.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("weekly_challenge_results").insert({
          challenge_id: challenge.id,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          total_score: result.score,
          games_played: 1,
          correct_answers: result.correct,
          best_time: result.time,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["user-weekly-result"] });
      queryClient.invalidateQueries({ queryKey: ["user-weekly-result-game"] });
    },
  });

  // Generate numbers for a problem
  const generateNumbers = useCallback(() => {
    if (!challenge) return [];
    const numbers: number[] = [];
    const count = challenge.problem_count;
    const baseSeed = challenge.seed + gameState.currentProblem * 10000;

    for (let i = 0; i < count; i++) {
      const num = generateNumber(challenge.formula_type, challenge.digit_count, baseSeed, i);
      numbers.push(num);
    }

    return numbers;
  }, [challenge, gameState.currentProblem]);

  // Start game
  const startGame = () => {
    setGameState((prev) => ({ ...prev, status: "countdown" }));
    setCountdown(3);
  };

  // Countdown effect
  useEffect(() => {
    if (gameState.status !== "countdown") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const numbers = generateNumbers();
      const correctAnswer = numbers.reduce((sum, n) => sum + n, 0);
      setGameState((prev) => ({
        ...prev,
        status: "showing",
        numbers,
        correctAnswer,
        currentNumberIndex: 0,
        startTime: Date.now(),
      }));
    }
  }, [countdown, gameState.status, generateNumbers]);

  // Show numbers one by one
  useEffect(() => {
    if (gameState.status !== "showing" || !challenge) return;

    if (gameState.currentNumberIndex < gameState.numbers.length) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          currentNumberIndex: prev.currentNumberIndex + 1,
        }));
      }, challenge.speed * 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState((prev) => ({ ...prev, status: "input" }));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameState.status, gameState.currentNumberIndex, gameState.numbers.length, challenge]);

  // Submit answer
  const submitAnswer = () => {
    const userAnswer = parseInt(gameState.answer) || null;
    const isCorrect = userAnswer === gameState.correctAnswer;
    const timeTaken = Date.now() - gameState.startTime;

    if (isCorrect) {
      playSound("correct");
    } else {
      playSound("incorrect");
    }

    // Adaptive Gamification - process answer
    const difficultyMultiplier = (challenge?.digit_count || 1) + (challenge?.formula_type === 'hammasi' ? 1 : 0);
    gamification.processAnswer(isCorrect, timeTaken, difficultyMultiplier);

    const newResults = [
      ...gameState.results,
      {
        correct: isCorrect,
        answer: gameState.correctAnswer,
        userAnswer,
        time: timeTaken,
      },
    ];

    if (gameState.currentProblem + 1 >= (challenge?.problem_count || 5)) {
      // Game finished
      const correctCount = newResults.filter((r) => r.correct).length;
      const totalTime = newResults.reduce((sum, r) => sum + r.time, 0);
      const score = correctCount * 100 + Math.max(0, Math.floor((30000 - totalTime / newResults.length) / 100));

      if (correctCount === newResults.length) {
        triggerAchievementConfetti();
      }

      submitResultMutation.mutate({
        score,
        correct: correctCount,
        time: totalTime,
      });

      setGameState((prev) => ({
        ...prev,
        status: "finished",
        results: newResults,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        status: "result",
        results: newResults,
      }));

      // Move to next problem after delay
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          status: "countdown",
          currentProblem: prev.currentProblem + 1,
          answer: "",
        }));
        setCountdown(2);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && gameState.status === "input") {
      submitAnswer();
    }
  };

  const getFormulaLabel = (type: string) => {
    const labels: Record<string, string> = {
      oddiy: "Oddiy",
      formula5: "5-formula",
      formula10plus: "10+ formula",
      formula10minus: "10- formula",
      hammasi: "Hammasi",
    };
    return labels[type] || type;
  };

  const getTimeRemaining = () => {
    if (!challenge) return null;
    const end = new Date(challenge.week_end);
    end.setHours(23, 59, 59);
    const now = new Date();
    const days = differenceInDays(end, now);
    const hours = differenceInHours(end, now) % 24;
    return { days, hours };
  };

  const timeRemaining = getTimeRemaining();
  const correctCount = gameState.results.filter((r) => r.correct).length;
  const totalTime = gameState.results.reduce((sum, r) => sum + r.time, 0);

  if (!user) {
    return (
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center">
          <Card className="max-w-md w-full mx-auto bg-card/80 dark:bg-card/60 backdrop-blur-sm border-border/40 dark:border-border/20 shadow-xl dark:shadow-2xl dark:shadow-primary/10">
            <CardContent className="py-8 sm:py-10 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 flex items-center justify-center mx-auto mb-4 border border-purple-500/30 dark:border-purple-500/40">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Tizimga kiring</h2>
              <p className="text-muted-foreground dark:text-muted-foreground/80 mb-4 text-sm sm:text-base">Haftalik musobaqada ishtirok etish uchun tizimga kiring</p>
              <Button onClick={() => navigate("/auth")} className="shadow-lg dark:shadow-primary/20">Kirish</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </PageBackground>
    );
  }

  if (isLoading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground dark:text-muted-foreground/80 mt-3 text-sm">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  if (!challenge) {
    return (
      <PageBackground className="flex flex-col min-h-screen">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-3 sm:px-4 py-6 sm:py-8 flex items-center justify-center">
          <Card className="max-w-md w-full mx-auto bg-card/80 dark:bg-card/60 backdrop-blur-sm border-border/40 dark:border-border/20 shadow-xl dark:shadow-2xl dark:shadow-primary/10">
            <CardContent className="py-8 sm:py-10 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 flex items-center justify-center mx-auto mb-4 border border-purple-500/30 dark:border-purple-500/40">
                <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-purple-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Musobaqa topilmadi</h2>
              <p className="text-muted-foreground dark:text-muted-foreground/80 mb-4 text-sm sm:text-base">Hozirda faol haftalik musobaqa mavjud emas</p>
              <Button variant="outline" onClick={() => navigate("/")} className="dark:border-border/40 dark:hover:bg-secondary/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </PageBackground>
    );
  }

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="dark:hover:bg-secondary/50">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Orqaga</span>
            </Button>
            {timeRemaining && (
              <Badge variant="secondary" className="bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining.days}k {timeRemaining.hours}s qoldi
              </Badge>
            )}
          </div>

          {/* Gamification Display */}
          {user && !gamification.isLoading && gameState.status === "idle" && (
            <div className="mb-4 sm:mb-6">
              <GamificationDisplay
                level={gamification.level}
                currentXp={gamification.currentXp}
                requiredXp={gamification.requiredXp}
                levelProgress={gamification.levelProgress}
                energy={gamification.energy}
                maxEnergy={gamification.maxEnergy}
                combo={gamification.combo}
                comboMultiplier={gamification.comboMultiplier}
                difficultyLevel={gamification.difficultyLevel}
                xpUntilLevelUp={gamification.xpUntilLevelUp}
                isStruggling={gamification.isStruggling}
                isFlagged={gamification.isFlagged}
                compact
              />
            </div>
          )}

          {/* Challenge Info */}
          <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-purple-500/10 to-pink-500/5 dark:from-purple-500/20 dark:to-pink-500/10 border-purple-500/20 dark:border-purple-500/30 shadow-lg dark:shadow-xl dark:shadow-purple-500/10">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 dark:bg-purple-500/30">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
                Haftalik Musobaqa
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                <Badge variant="outline" className="dark:border-border/40 dark:bg-secondary/30 text-xs sm:text-sm">{getFormulaLabel(challenge.formula_type)}</Badge>
                <Badge variant="outline" className="dark:border-border/40 dark:bg-secondary/30 text-xs sm:text-sm">{challenge.digit_count} xonali</Badge>
                <Badge variant="outline" className="dark:border-border/40 dark:bg-secondary/30 text-xs sm:text-sm">{challenge.speed}s</Badge>
                <Badge variant="outline" className="dark:border-border/40 dark:bg-secondary/30 text-xs sm:text-sm">{challenge.problem_count} misol</Badge>
              </div>
              {userResult && (
                <div className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80 mt-2 sm:mt-3 p-2 sm:p-3 rounded-lg bg-secondary/50 dark:bg-secondary/30 border border-border/30 dark:border-border/20">
                  Sizning natijangiz: <span className="font-bold text-primary">{userResult.total_score} ball</span> ({userResult.games_played} o'yin)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Area */}
          <Card className="overflow-hidden bg-card/80 dark:bg-card/60 backdrop-blur-sm border-border/40 dark:border-border/20 shadow-xl dark:shadow-2xl dark:shadow-primary/10">
            <CardContent className="p-4 sm:p-6 min-h-[350px] sm:min-h-[400px] flex flex-col items-center justify-center">
              {/* Idle State */}
              {gameState.status === "idle" && (
                <div className="text-center space-y-4 sm:space-y-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg dark:shadow-xl dark:shadow-purple-500/30">
                    <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold mb-2 text-foreground">Tayyor misiz?</h2>
                    <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm sm:text-base">
                      {challenge.problem_count} ta misolni yechib, ball to'plang!
                    </p>
                  </div>
                  <Button size="lg" onClick={startGame} className="gap-2 shadow-lg dark:shadow-primary/20">
                    <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                    Boshlash
                  </Button>
                </div>
              )}

              {/* Countdown */}
              {gameState.status === "countdown" && (
                <div className="text-center">
                  <div className="text-7xl sm:text-8xl font-bold text-primary animate-pulse drop-shadow-lg dark:drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">{countdown}</div>
                  <p className="text-muted-foreground dark:text-muted-foreground/80 mt-4 text-sm sm:text-base">Tayyor bo'ling...</p>
                </div>
              )}

              {/* Showing Numbers */}
              {gameState.status === "showing" && (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80">
                    Misol {gameState.currentProblem + 1}/{challenge.problem_count}
                  </div>
                  <div className="text-6xl sm:text-7xl md:text-8xl font-bold text-primary tabular-nums drop-shadow-lg dark:drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]">
                    {gameState.currentNumberIndex > 0 && gameState.currentNumberIndex <= gameState.numbers.length ? (
                      <>
                        {gameState.numbers[gameState.currentNumberIndex - 1] >= 0 ? "+" : ""}
                        {gameState.numbers[gameState.currentNumberIndex - 1]}
                      </>
                    ) : (
                      "..."
                    )}
                  </div>
                  <Progress
                    value={(gameState.currentNumberIndex / gameState.numbers.length) * 100}
                    className="w-36 sm:w-48 mx-auto"
                  />
                </div>
              )}

              {/* Input Answer */}
              {gameState.status === "input" && (
                <div className="text-center space-y-4 sm:space-y-6 w-full max-w-xs">
                  <div className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80">
                    Misol {gameState.currentProblem + 1}/{challenge.problem_count}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-foreground">Javobingizni kiriting</h3>
                    <Input
                      ref={inputRef}
                      type="number"
                      value={gameState.answer}
                      onChange={(e) => setGameState((prev) => ({ ...prev, answer: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Javob"
                      className="text-center text-xl sm:text-2xl h-12 sm:h-14 bg-secondary/50 dark:bg-secondary/30 border-border/40 dark:border-border/20 focus:border-primary dark:focus:border-primary"
                      autoFocus
                    />
                  </div>
                  <Button size="lg" onClick={submitAnswer} className="w-full shadow-lg dark:shadow-primary/20">
                    Tasdiqlash
                  </Button>
                </div>
              )}

              {/* Result */}
              {gameState.status === "result" && (
                <div className="text-center space-y-3 sm:space-y-4">
                  {gameState.results[gameState.results.length - 1]?.correct ? (
                    <>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center mx-auto border border-green-500/30 dark:border-green-500/40 shadow-lg dark:shadow-green-500/20">
                        <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-green-500">To'g'ri!</h3>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 dark:bg-red-500/30 flex items-center justify-center mx-auto border border-red-500/30 dark:border-red-500/40 shadow-lg dark:shadow-red-500/20">
                        <X className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-red-500">Noto'g'ri</h3>
                      <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm sm:text-base">
                        To'g'ri javob: <span className="font-bold text-foreground">{gameState.correctAnswer}</span>
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Finished */}
              {gameState.status === "finished" && (
                <div className="text-center space-y-4 sm:space-y-6 w-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg dark:shadow-xl dark:shadow-amber-500/30">
                    <Award className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">O'yin tugadi!</h2>
                    <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm sm:text-base">Natijalaringiz saqlandi</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm mx-auto">
                    <div className="bg-green-500/10 dark:bg-green-500/20 rounded-xl p-3 sm:p-4 border border-green-500/20 dark:border-green-500/30">
                      <div className="text-xl sm:text-2xl font-bold text-green-500">{correctCount}</div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">To'g'ri</div>
                    </div>
                    <div className="bg-red-500/10 dark:bg-red-500/20 rounded-xl p-3 sm:p-4 border border-red-500/20 dark:border-red-500/30">
                      <div className="text-xl sm:text-2xl font-bold text-red-500">{gameState.results.length - correctCount}</div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">Noto'g'ri</div>
                    </div>
                    <div className="bg-amber-500/10 dark:bg-amber-500/20 rounded-xl p-3 sm:p-4 border border-amber-500/20 dark:border-amber-500/30">
                      <div className="text-xl sm:text-2xl font-bold text-amber-500">
                        {(totalTime / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">Vaqt</div>
                    </div>
                  </div>

                  <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGameState({
                          status: "idle",
                          currentProblem: 0,
                          numbers: [],
                          currentNumberIndex: 0,
                          answer: "",
                          correctAnswer: 0,
                          results: [],
                          startTime: 0,
                        });
                      }}
                      className="dark:border-border/40 dark:hover:bg-secondary/50"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Yana o'ynash
                    </Button>
                    <Button onClick={() => navigate("/")} className="shadow-lg dark:shadow-primary/20">
                      Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default WeeklyGame;
