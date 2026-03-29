import { useState, useCallback, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { useProgressEngine } from '@/hooks/useProgressEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, Timer, TrendingUp, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateMultiplicationExample,
  generateMultiplicationOptions,
  MULTIPLICATION_TABLE_RANGES,
  type MultiplicationExample,
} from '@/lib/multiplicationGenerator';

interface Props {
  subjectId: string;
  difficulty: string;
  practiceType: string;
  onBack: () => void;
}

const generateProblem = (difficulty: string) => {
  const config = MULTIPLICATION_TABLE_RANGES[difficulty] || MULTIPLICATION_TABLE_RANGES.beginner;
  const example = generateMultiplicationExample({
    multiplicandDigits: config.multiplicandDigits,
    multiplierDigits: config.multiplierDigits,
    maxResultDigits: 10,
  });

  const options = generateMultiplicationOptions(example.answer, 4);
  return {
    a: example.a,
    b: example.b,
    answer: example.answer,
    options,
    correctIndex: options.indexOf(example.answer),
  };
};

export const MultiplicationPractice = ({ difficulty, onBack }: Props) => {
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const progressEngine = useProgressEngine();

  const [problem, setProblem] = useState(() => generateProblem(difficulty));
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Finish session and save progress when game ends
  useEffect(() => {
    if (finished && user) {
      const config = MULTIPLICATION_TABLE_RANGES[difficulty] || MULTIPLICATION_TABLE_RANGES.beginner;
      progressEngine.finishSession({
        topic: 'kopaytirish',
        operation: 'multiply',
        mainFormula: null,
        digitsCount: config.multiplicandDigits,
        termsCount: total,
      });
    }
  }, [finished]);

  const start = useCallback(() => {
    progressEngine.startSession();
    setIsRunning(true);
    setFinished(false);
    setScore(0);
    setTotal(0);
    setTimeLeft(60);
    setProblem(generateProblem(difficulty));
    setAnswered(null);
    setAnswerStartTime(Date.now());
  }, [difficulty, progressEngine]);

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;
    setAnswered(optionIndex);
    const correct = problem.options[optionIndex] === problem.answer;
    const responseTimeMs = Date.now() - answerStartTime;

    if (correct) setScore(s => s + 1);
    setTotal(t => t + 1);

    // Record attempt for progress engine
    progressEngine.recordAttempt({
      isCorrect: correct,
      responseTimeMs,
      correctAnswer: problem.answer,
      userAnswer: problem.options[optionIndex],
    });

    setTimeout(() => {
      setProblem(generateProblem(difficulty));
      setAnswered(null);
      setAnswerStartTime(Date.now());
    }, 600);
  };

  const lastResult = progressEngine.lastResult;

  if (!isRunning && !finished) {
    const config = MULTIPLICATION_TABLE_RANGES[difficulty] || MULTIPLICATION_TABLE_RANGES.beginner;
    return (
      <div className="min-h-screen bg-background">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">✖️ Ko'paytirish Jadvali</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl block mb-4">✖️</span>
              <h2 className="text-2xl font-bold mb-2">Ko'paytirish mashqi</h2>
              <p className="text-muted-foreground mb-2">
                {config.multiplicandDigits}×{config.multiplierDigits} xonali
              </p>
              <p className="text-muted-foreground mb-6">60 soniyada imkon qadar ko'p masala yeching!</p>
              <Button size="lg" onClick={start}>▶️ Boshlash</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (finished) {
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-background">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <span className="text-6xl block">{score >= total * 0.8 ? '🎉' : '💪'}</span>
              <h2 className="text-2xl font-bold">Natija</h2>
              <p className="text-4xl font-bold text-primary">{score}/{total}</p>
              <p className="text-muted-foreground">
                {accuracy}% aniqlik
              </p>

              {/* Progress Engine Results */}
              {lastResult && (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <div className="flex items-center gap-2 justify-center">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">+{lastResult.xp.earned} XP</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Level {lastResult.level.newLevel}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Target className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">{lastResult.streak.currentStreak} kun streak</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-sm font-medium">
                      Mastery: {lastResult.topicProgress.masteryPercent}%
                    </span>
                  </div>
                  {lastResult.level.levelUp && (
                    <div className="col-span-2 bg-primary/10 rounded-lg p-3">
                      <p className="text-lg font-bold text-primary">
                        🎉 Level {lastResult.level.newLevel} ga ko'tarildingiz!
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={onBack}>Orqaga</Button>
                <Button onClick={start} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Qayta
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">✖️ Ko'paytirish</h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            <span className="font-mono font-bold">{timeLeft}s</span>
          </div>
          <Badge variant="secondary">✅ {score}/{total}</Badge>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${problem.a}-${problem.b}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <p className="text-5xl md:text-6xl font-bold mb-8">
                  {problem.a} × {problem.b} = ?
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {problem.options.map((opt, i) => {
                    const isCorrect = opt === problem.answer;
                    const isSelected = answered === i;
                    let cls = 'border-2 border-muted-foreground/20 hover:border-primary';
                    if (answered !== null) {
                      if (isCorrect) cls = 'border-2 border-green-500 bg-green-50 dark:bg-green-500/10';
                      else if (isSelected) cls = 'border-2 border-red-500 bg-red-50 dark:bg-red-500/10';
                    }
                    return (
                      <button
                        key={i}
                        className={`h-14 rounded-xl text-xl font-bold transition-all ${cls}`}
                        onClick={() => handleAnswer(i)}
                        disabled={answered !== null}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
