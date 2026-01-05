import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  Loader2,
  Lightbulb
} from 'lucide-react';

interface PracticeConfig {
  enabled: boolean;
  difficulty: string;
  problems_count: number;
}

interface AdminExample {
  id: string;
  question: string;
  answer: number;
  hint: string | null;
  explanation: string | null;
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
  const [problems, setProblems] = useState<Array<{ question: string; answer: number; hint?: string | null; explanation?: string | null }>>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [loadingExamples, setLoadingExamples] = useState(false);

  const startPractice = async () => {
    setLoadingExamples(true);
    
    // First try to fetch admin examples for this lesson
    const { data: adminExamples } = await supabase
      .from('math_examples')
      .select('id, question, answer, hint, explanation')
      .eq('lesson_id', lessonId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    let newProblems = [];

    if (adminExamples && adminExamples.length > 0) {
      // Use admin examples
      const shuffled = [...adminExamples].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, config.problems_count);
      newProblems = selected.map(ex => ({
        question: ex.question,
        answer: ex.answer,
        hint: ex.hint,
        explanation: ex.explanation
      }));
    } else {
      // Fallback to generated problems
      for (let i = 0; i < config.problems_count; i++) {
        const problem = generateProblem(config.difficulty as 'easy' | 'medium' | 'hard', 'mixed');
        newProblems.push({
          question: problem.question,
          answer: problem.correctAnswer,
          hint: null,
          explanation: null
        });
      }
    }

    setProblems(newProblems);
    setCurrentProblem(0);
    setCorrect(0);
    setIncorrect(0);
    setStarted(true);
    setFinished(false);
    setUserAnswer('');
    setShowHint(false);
    setLoadingExamples(false);
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
      setShowHint(false);

      if (currentProblem + 1 >= problems.length) {
        const finalScore = Math.round(((isCorrect ? correct + 1 : correct) / problems.length) * 100);
        setFinished(true);
        onComplete(finalScore);
      } else {
        setCurrentProblem(prev => prev + 1);
      }
    }, 1500);
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
          <Button onClick={startPractice} size="lg" disabled={loadingExamples}>
            {loadingExamples ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
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
          <h3 className="text-2xl font-bold mb-2">
            {score >= 80 ? "Ajoyib natija! 🎉" : score >= 60 ? "Yaxshi ish! 👏" : "Yaxshi harakat! 💪"}
          </h3>
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
          <Button onClick={startPractice} variant="outline" disabled={loadingExamples}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Qayta urinish
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentHint = problems[currentProblem]?.hint;

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
            <div className="flex flex-col items-center gap-3">
              {lastResult === 'correct' ? (
                <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  To'g'ri!
                </Badge>
              ) : (
                <>
                  <Badge className="bg-red-500 text-white text-lg px-4 py-2">
                    <XCircle className="h-5 w-5 mr-2" />
                    Noto'g'ri: {problems[currentProblem]?.answer}
                  </Badge>
                  {problems[currentProblem]?.explanation && (
                    <p className="text-sm text-muted-foreground max-w-md">
                      {problems[currentProblem].explanation}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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

              {currentHint && (
                <div className="max-w-sm mx-auto">
                  {showHint ? (
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm text-warning">{currentHint}</p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowHint(true)}
                      className="text-warning hover:text-warning"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Maslahat ko'rish
                    </Button>
                  )}
                </div>
              )}
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