import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Tizimga kiring</h2>
              <p className="text-muted-foreground mb-4">Haftalik musobaqada ishtirok etish uchun tizimga kiring</p>
              <Button onClick={() => navigate("/auth")}>Kirish</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="flex-1 container px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-8 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Musobaqa topilmadi</h2>
              <p className="text-muted-foreground mb-4">Hozirda faol haftalik musobaqa mavjud emas</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
            {timeRemaining && (
              <Badge variant="secondary" className="bg-purple-500/20">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining.days}k {timeRemaining.hours}s qoldi
              </Badge>
            )}
          </div>

          {/* Challenge Info */}
          <Card className="mb-6 bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                Haftalik Musobaqa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline">{getFormulaLabel(challenge.formula_type)}</Badge>
                <Badge variant="outline">{challenge.digit_count} xonali</Badge>
                <Badge variant="outline">{challenge.speed}s</Badge>
                <Badge variant="outline">{challenge.problem_count} misol</Badge>
              </div>
              {userResult && (
                <div className="text-sm text-muted-foreground">
                  Sizning natijangiz: <span className="font-bold text-primary">{userResult.total_score} ball</span> ({userResult.games_played} o'yin)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Area */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 min-h-[400px] flex flex-col items-center justify-center">
              {/* Idle State */}
              {gameState.status === "idle" && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">Tayyor misiz?</h2>
                    <p className="text-muted-foreground">
                      {challenge.problem_count} ta misolni yechib, ball to'plang!
                    </p>
                  </div>
                  <Button size="lg" onClick={startGame} className="gap-2">
                    <Play className="h-5 w-5" />
                    Boshlash
                  </Button>
                </div>
              )}

              {/* Countdown */}
              {gameState.status === "countdown" && (
                <div className="text-center">
                  <div className="text-8xl font-bold text-primary animate-pulse">{countdown}</div>
                  <p className="text-muted-foreground mt-4">Tayyor bo'ling...</p>
                </div>
              )}

              {/* Showing Numbers */}
              {gameState.status === "showing" && (
                <div className="text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Misol {gameState.currentProblem + 1}/{challenge.problem_count}
                  </div>
                  <div className="text-7xl md:text-8xl font-bold text-primary tabular-nums">
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
                    className="w-48 mx-auto"
                  />
                </div>
              )}

              {/* Input Answer */}
              {gameState.status === "input" && (
                <div className="text-center space-y-6 w-full max-w-xs">
                  <div className="text-sm text-muted-foreground">
                    Misol {gameState.currentProblem + 1}/{challenge.problem_count}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Javobingizni kiriting</h3>
                    <Input
                      ref={inputRef}
                      type="number"
                      value={gameState.answer}
                      onChange={(e) => setGameState((prev) => ({ ...prev, answer: e.target.value }))}
                      onKeyDown={handleKeyDown}
                      placeholder="Javob"
                      className="text-center text-2xl h-14"
                      autoFocus
                    />
                  </div>
                  <Button size="lg" onClick={submitAnswer} className="w-full">
                    Tasdiqlash
                  </Button>
                </div>
              )}

              {/* Result */}
              {gameState.status === "result" && (
                <div className="text-center space-y-4">
                  {gameState.results[gameState.results.length - 1]?.correct ? (
                    <>
                      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                        <Check className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-green-500">To'g'ri!</h3>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <X className="h-10 w-10 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-red-500">Noto'g'ri</h3>
                      <p className="text-muted-foreground">
                        To'g'ri javob: <span className="font-bold">{gameState.correctAnswer}</span>
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Finished */}
              {gameState.status === "finished" && (
                <div className="text-center space-y-6 w-full">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto">
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">O'yin tugadi!</h2>
                    <p className="text-muted-foreground">Natijalaringiz saqlandi</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-primary">{correctCount}</div>
                      <div className="text-xs text-muted-foreground">To'g'ri</div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="text-2xl font-bold">{gameState.results.length - correctCount}</div>
                      <div className="text-xs text-muted-foreground">Noto'g'ri</div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-amber-500">
                        {(totalTime / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-muted-foreground">Vaqt</div>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
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
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Yana o'ynash
                    </Button>
                    <Button onClick={() => navigate("/")}>
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
    </div>
  );
};

export default WeeklyGame;
