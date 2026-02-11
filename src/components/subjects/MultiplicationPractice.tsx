import { useState, useCallback, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  subjectId: string;
  difficulty: string;
  practiceType: string;
  onBack: () => void;
}

const TABLE_RANGES: Record<string, number[]> = {
  beginner: [2, 3, 4, 5],
  elementary: [6, 7, 8, 9],
  intermediate: [2, 3, 4, 5, 6, 7, 8, 9],
  advanced: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
};

const generateProblem = (tables: number[]) => {
  const a = tables[Math.floor(Math.random() * tables.length)];
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = a * b;

  // Generate wrong options
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const wrong = answer + (Math.floor(Math.random() * 20) - 10);
    if (wrong > 0 && wrong !== answer) options.add(wrong);
  }
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
  return { a, b, answer, options: shuffled, correctIndex: shuffled.indexOf(answer) };
};

export const MultiplicationPractice = ({ difficulty, practiceType, onBack }: Props) => {
  const { soundEnabled, toggleSound } = useSound();
  const tables = TABLE_RANGES[difficulty] || TABLE_RANGES.beginner;
  const [problem, setProblem] = useState(() => generateProblem(tables));
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setIsRunning(false); setFinished(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
    setFinished(false);
    setScore(0);
    setTotal(0);
    setTimeLeft(60);
    setProblem(generateProblem(tables));
    setAnswered(null);
  }, [tables]);

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;
    setAnswered(optionIndex);
    const correct = problem.options[optionIndex] === problem.answer;
    if (correct) setScore(s => s + 1);
    setTotal(t => t + 1);

    setTimeout(() => {
      setProblem(generateProblem(tables));
      setAnswered(null);
    }, 600);
  };

  if (!isRunning && !finished) {
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
              <p className="text-muted-foreground mb-2">Jadvallar: {tables.join(', ')}</p>
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
    return (
      <div className="min-h-screen bg-background">
        <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl block mb-4">{score >= total * 0.8 ? '🎉' : '💪'}</span>
              <h2 className="text-2xl font-bold mb-2">Natija</h2>
              <p className="text-4xl font-bold text-primary mb-2">{score}/{total}</p>
              <p className="text-muted-foreground mb-6">
                {total > 0 ? `${Math.round((score / total) * 100)}% aniqlik` : ''}
              </p>
              <div className="flex gap-3 justify-center">
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
