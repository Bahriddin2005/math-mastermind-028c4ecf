import { useState, useEffect, useCallback } from 'react';
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

const WORDS_BY_DIFFICULTY: Record<string, string[]> = {
  beginner: ['kitob', 'qalam', 'maktab', 'uy', 'ot', 'it', 'bola', 'ona', 'ota', 'suv', 'non', 'osh', 'ko\'z', 'qo\'l', 'oyoq'],
  elementary: ['o\'quvchi', 'daftar', 'o\'qituvchi', 'kompyuter', 'telefon', 'mashina', 'samolyot', 'daryo', 'tog\'lar', 'gullar'],
  intermediate: ['kutubxona', 'laboratoriya', 'matematika', 'informatika', 'biologiya', 'geografiya', 'tabiatshunoslik', 'astronomiya'],
  advanced: ['telekommunikatsiya', 'dasturlash', 'intellekt', 'texnologiya', 'rivojlanish', 'tadqiqot', 'eksperiment', 'innovatsiya'],
};

export const SpeedReadingPractice = ({ difficulty, practiceType, onBack }: Props) => {
  const { soundEnabled, toggleSound } = useSound();
  const words = WORDS_BY_DIFFICULTY[difficulty] || WORDS_BY_DIFFICULTY.beginner;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  const speedMs = { beginner: 2000, elementary: 1500, intermediate: 1000, advanced: 700 }[difficulty] || 1500;

  const startPractice = useCallback(() => {
    setIsRunning(true);
    setScore(0);
    setTotal(0);
    setCurrentIndex(0);
    setTimeLeft(60);
    setShowWord(true);
    setShowResult(null);
    setUserInput('');
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setIsRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !showWord) return;
    const timer = setTimeout(() => {
      setShowWord(false);
    }, speedMs);
    return () => clearTimeout(timer);
  }, [isRunning, showWord, currentIndex, speedMs]);

  const checkAnswer = () => {
    const correct = userInput.trim().toLowerCase() === words[currentIndex].toLowerCase();
    setShowResult(correct);
    if (correct) setScore(s => s + 1);
    setTotal(t => t + 1);

    setTimeout(() => {
      setShowResult(null);
      setUserInput('');
      setCurrentIndex(i => (i + 1) % words.length);
      setShowWord(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">📖 Tez O'qish</h1>
          <Badge variant="outline">{practiceType}</Badge>
        </div>

        {!isRunning && timeLeft === 60 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl block mb-4">📖</span>
              <h2 className="text-2xl font-bold mb-2">Tez O'qish Mashqi</h2>
              <p className="text-muted-foreground mb-6">
                So'z ekranda paydo bo'ladi va tezda yo'qoladi. Uni eslab qoling va yozing!
              </p>
              <Button size="lg" onClick={startPractice} className="gap-2">
                ▶️ Boshlash
              </Button>
            </CardContent>
          </Card>
        ) : !isRunning ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl block mb-4">🏆</span>
              <h2 className="text-2xl font-bold mb-2">Natija</h2>
              <p className="text-4xl font-bold text-primary mb-2">{score}/{total}</p>
              <p className="text-muted-foreground mb-6">
                {total > 0 ? `${Math.round((score / total) * 100)}% aniqlik` : ''}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onBack}>Orqaga</Button>
                <Button onClick={startPractice} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Qayta boshlash
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Timer & Score */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4" />
                <span className="font-mono font-bold">{timeLeft}s</span>
              </div>
              <Badge variant="secondary" className="text-sm">
                ✅ {score}/{total}
              </Badge>
            </div>

            {/* Word Display */}
            <Card className="min-h-[200px] flex items-center justify-center">
              <CardContent className="p-8 text-center w-full">
                <AnimatePresence mode="wait">
                  {showWord ? (
                    <motion.div
                      key={`word-${currentIndex}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="text-4xl md:text-5xl font-bold text-primary"
                    >
                      {words[currentIndex]}
                    </motion.div>
                  ) : showResult !== null ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      {showResult ? (
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-500" />
                      )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                        placeholder="So'zni yozing..."
                        className="text-2xl text-center border-b-2 border-primary/30 bg-transparent outline-none w-full py-2"
                        autoFocus
                      />
                      <Button className="mt-4" onClick={checkAnswer} disabled={!userInput.trim()}>
                        Tekshirish
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
