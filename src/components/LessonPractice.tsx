import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { generateProblem } from '@/lib/mathGenerator';
import { 
  Target, 
  CheckCircle2, 
  XCircle,
  Play,
  Trophy,
  RotateCcw,
  Loader2
} from 'lucide-react';

interface PracticeConfig {
  enabled: boolean;
  difficulty: string;
  problems_count: number;
}

interface LessonPracticeProps {
  lessonId: string;
  config: PracticeConfig;
  onComplete: (score: number) => void;
  isCompleted: boolean;
}

export const LessonPractice = ({ lessonId, config, onComplete, isCompleted }: LessonPracticeProps) => {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [problems, setProblems] = useState<Array<{ question: string; answer: number }>>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const [finished, setFinished] = useState(false);

  const startPractice = () => {
    // Generate problems based on config
    const newProblems = [];
    for (let i = 0; i < config.problems_count; i++) {
      const problem = generateProblem(config.difficulty as 'easy' | 'medium' | 'hard', 'mixed');
      newProblems.push({
        question: problem.question,
        answer: problem.correctAnswer
      });
    }
    setProblems(newProblems);
    setCurrentProblem(0);
    setCorrect(0);
    setIncorrect(0);
    setStarted(true);
    setFinished(false);
    setUserAnswer('');
  };

  const checkAnswer = () => {
    const userNum = parseInt(userAnswer);
    const isCorrect = userNum === problems[currentProblem].answer;

    if (isCorrect) {
      setCorrect(prev => prev + 1);
      setLastResult('correct');
    } else {
      setIncorrect(prev => prev + 1);
      setLastResult('incorrect');
    }

    setShowResult(true);

    setTimeout(() => {
      setShowResult(false);
      setLastResult(null);
      setUserAnswer('');

      if (currentProblem + 1 >= problems.length) {
        const finalScore = Math.round(((isCorrect ? correct + 1 : correct) / problems.length) * 100);
        setFinished(true);
        onComplete(finalScore);
      } else {
        setCurrentProblem(prev => prev + 1);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      checkAnswer();
    }
  };

  if (!config.enabled) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Bu dars uchun mashq mavjud emas</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground mb-3">Mashq qilish uchun tizimga kiring</p>
          <Button variant="outline" onClick={() => window.location.href = '/auth'}>
            Kirish
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted && !started) {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
            Mashq tugatilgan!
          </h3>
          <p className="text-muted-foreground mb-4">
            Siz bu mashqni muvaffaqiyatli tugatdingiz
          </p>
          <Button variant="outline" onClick={startPractice}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Qayta mashq qilish
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Dars mashqi</h3>
          <p className="text-muted-foreground mb-4">
            Bu darsda o'rganganlaringizni mustahkamlang
          </p>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-muted-foreground">
            <Badge variant="secondary">{config.problems_count} masala</Badge>
            <Badge variant="secondary">
              {config.difficulty === 'easy' ? 'Oson' : config.difficulty === 'medium' ? "O'rta" : 'Qiyin'}
            </Badge>
          </div>
          <Button onClick={startPractice} size="lg">
            <Play className="h-5 w-5 mr-2" />
            Boshlash
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    const score = Math.round((correct / problems.length) * 100);
    return (
      <Card className={score >= 70 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}>
        <CardContent className="p-8 text-center">
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${score >= 70 ? 'text-green-500' : 'text-yellow-500'}`} />
          <h3 className="text-2xl font-bold mb-2">Mashq tugadi!</h3>
          <p className="text-4xl font-bold mb-4">{score}%</p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{correct}</p>
              <p className="text-sm text-muted-foreground">To'g'ri</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{incorrect}</p>
              <p className="text-sm text-muted-foreground">Noto'g'ri</p>
            </div>
          </div>
          <Button onClick={startPractice} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Qayta urinish
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Jarayon</span>
            <span className="font-medium">{currentProblem + 1}/{problems.length}</span>
          </div>
          <Progress value={((currentProblem + 1) / problems.length) * 100} className="h-2" />
        </div>

        {/* Problem */}
        <div className="text-center py-8">
          <p className={`text-5xl md:text-6xl font-bold mb-8 transition-all ${
            lastResult === 'correct' ? 'text-green-500 scale-110' :
            lastResult === 'incorrect' ? 'text-red-500 shake' : ''
          }`}>
            {problems[currentProblem]?.question}
          </p>

          {showResult ? (
            <div className="flex items-center justify-center gap-2">
              {lastResult === 'correct' ? (
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  To'g'ri!
                </Badge>
              ) : (
                <Badge className="bg-red-500 text-white text-lg px-4 py-2">
                  <XCircle className="h-5 w-5 mr-2" />
                  Noto'g'ri: {problems[currentProblem]?.answer}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Javob"
                className="text-center text-2xl h-14"
                autoFocus
              />
              <Button 
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                size="lg"
                className="h-14 px-6"
              >
                Tekshirish
              </Button>
            </div>
          )}
        </div>

        {/* Score */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">{correct}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium">{incorrect}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};