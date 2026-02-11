import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  subjectId: string;
  difficulty: string;
  practiceType: string;
  onBack: () => void;
}

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const QUESTIONS: Record<string, Record<string, Question[]>> = {
  beginner: {
    letters: [
      { question: "Bu qaysi harf? 🅰️", options: ['A', 'B', 'D', 'G'], correct: 0 },
      { question: "\"Kitob\" so'zi qaysi harf bilan boshlanadi?", options: ['M', 'K', 'T', 'B'], correct: 1 },
      { question: "\"Maktab\" so'zida nechta harf bor?", options: ['5', '6', '7', '4'], correct: 1 },
    ],
    syllables: [
      { question: "\"Ki-tob\" so'zi nechta bo'g'indan iborat?", options: ['1', '2', '3', '4'], correct: 1 },
      { question: "\"O-na\" so'zidagi birinchi bo'g'in qaysi?", options: ['Na', 'O', 'On', 'An'], correct: 1 },
    ],
    'word-building': [
      { question: "\"M + A + K + T + A + B\" = ?", options: ['Maktab', 'Kitob', 'Daftar', 'Qalam'], correct: 0 },
      { question: "\"K\" + \"itob\" = ?", options: ['Kitob', 'Daftar', 'Qalam', 'Ruchka'], correct: 0 },
    ],
    spelling: [
      { question: "To'g'ri yozilgan so'z qaysi?", options: ['Maktap', 'Maktab', 'Maktob', 'Maktub'], correct: 1 },
      { question: "To'g'ri variant qaysi?", options: ['Kitop', 'Kitob', 'Ketob', 'Kitab'], correct: 1 },
    ],
  },
  elementary: {
    letters: [
      { question: "O'zbek alifbosida nechta harf bor?", options: ['26', '29', '33', '36'], correct: 1 },
      { question: "Qaysi harf unli?", options: ['B', 'O', 'K', 'L'], correct: 1 },
    ],
    syllables: [
      { question: "\"Da-rix-tlar\" so'zi nechta bo'g'indan iborat?", options: ['2', '3', '4', '1'], correct: 1 },
    ],
    'word-building': [
      { question: "\"O'qi\" + \"tuvchi\" = ?", options: ['O\'qituvchi', 'O\'quvchi', 'O\'qish', 'Kitob'], correct: 0 },
    ],
    spelling: [
      { question: "To'g'ri yozilgan so'z qaysi?", options: ['O\'qitufchi', 'O\'qituvchi', 'Oqituvchi', 'O\'kituvchi'], correct: 1 },
    ],
  },
};

export const LiteracyPractice = ({ difficulty, practiceType, onBack }: Props) => {
  const { soundEnabled, toggleSound } = useSound();
  const questions = QUESTIONS[difficulty]?.[practiceType] || QUESTIONS.beginner.letters;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    if (answered !== null) return;
    setAnswered(optionIndex);
    if (optionIndex === questions[currentIndex].correct) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrentIndex(i => i + 1);
        setAnswered(null);
      }
    }, 1000);
  };

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setAnswered(null);
    setFinished(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">🔤 Savodxonlik</h1>
          <Badge variant="outline">{practiceType}</Badge>
        </div>

        {finished ? (
          <Card>
            <CardContent className="p-8 text-center">
              <span className="text-6xl block mb-4">{score === questions.length ? '🎉' : '📝'}</span>
              <h2 className="text-2xl font-bold mb-2">Natija</h2>
              <p className="text-4xl font-bold text-primary mb-2">{score}/{questions.length}</p>
              <p className="text-muted-foreground mb-6">
                {Math.round((score / questions.length) * 100)}% aniqlik
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onBack}>Orqaga</Button>
                <Button onClick={restart} className="gap-2">
                  <RotateCcw className="w-4 h-4" /> Qayta boshlash
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary">{currentIndex + 1}/{questions.length}</Badge>
              <Badge variant="outline">✅ {score}</Badge>
            </div>

            <Card>
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h3 className="text-xl font-bold mb-6 text-center">
                      {questions[currentIndex].question}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {questions[currentIndex].options.map((opt, i) => {
                        const isCorrect = i === questions[currentIndex].correct;
                        const isSelected = answered === i;
                        let variant: 'outline' | 'default' | 'destructive' = 'outline';
                        if (answered !== null) {
                          if (isCorrect) variant = 'default';
                          else if (isSelected) variant = 'destructive';
                        }
                        return (
                          <Button
                            key={i}
                            variant={variant}
                            className="h-14 text-base"
                            onClick={() => handleAnswer(i)}
                            disabled={answered !== null}
                          >
                            {answered !== null && isCorrect && <CheckCircle2 className="w-4 h-4 mr-1" />}
                            {answered !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 mr-1" />}
                            {opt}
                          </Button>
                        );
                      })}
                    </div>
                  </motion.div>
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
