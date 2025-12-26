import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AbacusDisplay } from './AbacusDisplay';
import { useSound } from '@/hooks/useSound';
import { 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle,
  Lightbulb,
  Target
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetNumber: number;
  explanation: string[];
  tip?: string;
}

const TUTORIAL_LESSONS: { id: string; title: string; steps: TutorialStep[] }[] = [
  {
    id: 'basics',
    title: "Abacus asoslari",
    steps: [
      {
        id: 'intro',
        title: "Abacus nima?",
        description: "Abacus - qadimiy hisoblash vositasi. U yuqori va pastki boncuklardan iborat.",
        targetNumber: 0,
        explanation: [
          "Yuqoridagi 1 ta boncuk = 5 qiymat",
          "Pastdagi 4 ta boncuk = har biri 1 qiymat",
          "Hozir abacus 0 ni ko'rsatmoqda"
        ],
        tip: "Boncuklar markaziy chiziqqa yaqinlashganda faollashadi"
      },
      {
        id: 'one',
        title: "1 sonini ko'rsatish",
        description: "Pastki boncukni yuqoriga ko'taring",
        targetNumber: 1,
        explanation: [
          "Pastdan 1 ta boncukni yuqoriga suring",
          "Bu 1 qiymatni beradi",
        ],
      },
      {
        id: 'two',
        title: "2 sonini ko'rsatish",
        description: "Ikkita pastki boncukni ko'taring",
        targetNumber: 2,
        explanation: [
          "Pastdan 2 ta boncukni yuqoriga suring",
          "1 + 1 = 2",
        ],
      },
      {
        id: 'three',
        title: "3 sonini ko'rsatish",
        description: "Uchta pastki boncukni ko'taring",
        targetNumber: 3,
        explanation: [
          "Pastdan 3 ta boncukni yuqoriga suring",
          "1 + 1 + 1 = 3",
        ],
      },
      {
        id: 'four',
        title: "4 sonini ko'rsatish",
        description: "To'rtta pastki boncukni ko'taring",
        targetNumber: 4,
        explanation: [
          "Pastdan 4 ta boncukni yuqoriga suring",
          "Bu maksimal pastki boncuklar soni",
          "1 + 1 + 1 + 1 = 4",
        ],
      },
      {
        id: 'five',
        title: "5 sonini ko'rsatish",
        description: "Yuqori boncukni pastga tushiring",
        targetNumber: 5,
        explanation: [
          "Yuqoridagi boncukni pastga tushiring",
          "Pastki boncuklarni tiklang (0 holatga)",
          "Yuqori boncuk = 5 qiymat",
        ],
        tip: "5 dan katta sonlar uchun yuqori boncuk ishlatiladi"
      },
    ]
  },
  {
    id: 'advanced',
    title: "6-9 sonlari",
    steps: [
      {
        id: 'six',
        title: "6 sonini ko'rsatish",
        description: "Yuqori boncuk + 1 pastki boncuk",
        targetNumber: 6,
        explanation: [
          "Yuqori boncuk = 5",
          "Pastdan 1 ta boncuk = 1",
          "5 + 1 = 6",
        ],
      },
      {
        id: 'seven',
        title: "7 sonini ko'rsatish",
        description: "Yuqori boncuk + 2 pastki boncuk",
        targetNumber: 7,
        explanation: [
          "Yuqori boncuk = 5",
          "Pastdan 2 ta boncuk = 2",
          "5 + 2 = 7",
        ],
      },
      {
        id: 'eight',
        title: "8 sonini ko'rsatish",
        description: "Yuqori boncuk + 3 pastki boncuk",
        targetNumber: 8,
        explanation: [
          "Yuqori boncuk = 5",
          "Pastdan 3 ta boncuk = 3",
          "5 + 3 = 8",
        ],
      },
      {
        id: 'nine',
        title: "9 sonini ko'rsatish",
        description: "Yuqori boncuk + 4 pastki boncuk",
        targetNumber: 9,
        explanation: [
          "Yuqori boncuk = 5",
          "Pastdan 4 ta boncuk = 4",
          "5 + 4 = 9",
          "Bu bir ustundagi maksimal qiymat!"
        ],
        tip: "10 uchun keyingi ustun (o'nliklar) kerak"
      },
    ]
  },
  {
    id: 'multi-digit',
    title: "Ko'p xonali sonlar",
    steps: [
      {
        id: 'tens-intro',
        title: "O'nliklar ustuni",
        description: "Chapdan ikkinchi ustun o'nliklarni ko'rsatadi",
        targetNumber: 10,
        explanation: [
          "O'ng ustun = birliklar (1-9)",
          "Chap ustun = o'nliklar (10, 20, 30...)",
          "10 = o'nliklar ustunida 1",
        ],
      },
      {
        id: 'twenty-five',
        title: "25 sonini ko'rsatish",
        description: "O'nliklar: 2, Birliklar: 5",
        targetNumber: 25,
        explanation: [
          "O'nliklar ustunida 2 (pastdan 2 boncuk)",
          "Birliklar ustunida 5 (yuqori boncuk)",
          "20 + 5 = 25",
        ],
      },
      {
        id: 'forty-seven',
        title: "47 sonini ko'rsatish",
        description: "O'nliklar: 4, Birliklar: 7",
        targetNumber: 47,
        explanation: [
          "O'nliklar ustunida 4 (pastdan 4 boncuk)",
          "Birliklar ustunida 7 (yuqori + 2 pastki)",
          "40 + 7 = 47",
        ],
      },
      {
        id: 'sixty-three',
        title: "63 sonini ko'rsatish",
        description: "O'nliklar: 6, Birliklar: 3",
        targetNumber: 63,
        explanation: [
          "O'nliklar ustunida 6 (yuqori + 1 pastki)",
          "Birliklar ustunida 3 (pastdan 3 boncuk)",
          "60 + 3 = 63",
        ],
      },
      {
        id: 'ninety-nine',
        title: "99 sonini ko'rsatish",
        description: "Ikki xonali maksimal son",
        targetNumber: 99,
        explanation: [
          "O'nliklar ustunida 9 (yuqori + 4 pastki)",
          "Birliklar ustunida 9 (yuqori + 4 pastki)",
          "90 + 9 = 99",
          "100 uchun yuzliklar ustuni kerak!"
        ],
        tip: "Har bir ustun 0-9 gacha ko'rsatishi mumkin"
      },
    ]
  }
];

interface AbacusTutorialProps {
  onComplete?: () => void;
}

export const AbacusTutorial = ({ onComplete }: AbacusTutorialProps) => {
  const { playSound } = useSound();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNumber, setShowNumber] = useState(true);

  const currentLesson = TUTORIAL_LESSONS[currentLessonIndex];
  const currentStep = currentLesson.steps[currentStepIndex];
  const totalSteps = TUTORIAL_LESSONS.reduce((sum, l) => sum + l.steps.length, 0);
  const completedCount = completedSteps.size;
  const progress = (completedCount / totalSteps) * 100;

  // Abacus ustunlari sonini aniqlash
  const getColumns = useCallback((num: number) => {
    if (num >= 100) return 3;
    if (num >= 10) return 2;
    return 1;
  }, []);

  const handleNext = useCallback(() => {
    playSound('correct');
    setCompletedSteps(prev => new Set([...prev, currentStep.id]));
    
    if (currentStepIndex < currentLesson.steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else if (currentLessonIndex < TUTORIAL_LESSONS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentLessonIndex(prev => prev + 1);
        setCurrentStepIndex(0);
        setIsAnimating(false);
      }, 300);
    } else {
      // Tutorial yakunlandi
      playSound('complete');
      onComplete?.();
    }
  }, [currentStep, currentStepIndex, currentLesson, currentLessonIndex, playSound, onComplete]);

  const handlePrevious = useCallback(() => {
    playSound('bead');
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
      setCurrentStepIndex(TUTORIAL_LESSONS[currentLessonIndex - 1].steps.length - 1);
    }
  }, [currentStepIndex, currentLessonIndex, playSound]);

  const handleReset = useCallback(() => {
    setCurrentLessonIndex(0);
    setCurrentStepIndex(0);
    setCompletedSteps(new Set());
  }, []);

  const handleBeadMove = useCallback(() => {
    playSound('bead');
  }, [playSound]);

  const isFirstStep = currentLessonIndex === 0 && currentStepIndex === 0;
  const isLastStep = currentLessonIndex === TUTORIAL_LESSONS.length - 1 && 
                     currentStepIndex === currentLesson.steps.length - 1;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            Abacus Tutorial
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{totalSteps} qadam
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Dars nomi */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">
            {currentLessonIndex + 1}-dars: {currentLesson.title}
          </Badge>
          <span className="text-xs text-muted-foreground">
            ({currentStepIndex + 1}/{currentLesson.steps.length})
          </span>
        </div>

        {/* Qadam sarlavhasi */}
        <div className={`text-center mb-6 transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <h3 className="text-xl font-bold mb-2">{currentStep.title}</h3>
          <p className="text-muted-foreground">{currentStep.description}</p>
        </div>

        {/* Abacus ko'rinishi */}
        <div className={`flex justify-center mb-6 transition-all duration-500 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
          <AbacusDisplay
            number={currentStep.targetNumber}
            size="lg"
            columns={getColumns(currentStep.targetNumber)}
            showNumber={showNumber}
            onBeadMove={handleBeadMove}
          />
        </div>

        {/* Tushuntirish */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              {currentStep.explanation.map((line, index) => (
                <p key={index} className="text-sm">{line}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Maslahat */}
        {currentStep.tip && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">{currentStep.tip}</p>
            </div>
          </div>
        )}

        {/* Boshqaruv tugmalari */}
        <div className="flex items-center justify-between gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Oldingi
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNumber(!showNumber)}
            >
              {showNumber ? "Sonni yashirish" : "Sonni ko'rsatish"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              title="Qayta boshlash"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleNext}
            className="gap-1"
          >
            {isLastStep ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Tugatish
              </>
            ) : (
              <>
                Keyingi
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Darslar ro'yxati */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Darslar:</p>
          <div className="flex flex-wrap gap-2">
            {TUTORIAL_LESSONS.map((lesson, index) => (
              <Button
                key={lesson.id}
                variant={currentLessonIndex === index ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentLessonIndex(index);
                  setCurrentStepIndex(0);
                }}
                className="text-xs"
              >
                {index + 1}. {lesson.title}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AbacusTutorial;
