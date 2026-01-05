import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Zap, Gift, Timer, Star, Trophy, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BonusChallengeProps {
  energy: number;
  maxEnergy: number;
  onComplete: (rewardXp: number, rewardEnergy: number) => void;
  onEnergyUse: (amount: number) => Promise<boolean>;
}

type ChallengeType = 'speed' | 'streak' | 'accuracy';

interface Challenge {
  type: ChallengeType;
  title: string;
  description: string;
  target: number;
  energyCost: number;
  rewardXp: number;
  rewardEnergy: number;
  timeLimit: number; // seconds
}

const CHALLENGES: Record<ChallengeType, Challenge> = {
  speed: {
    type: 'speed',
    title: 'Tez javob',
    description: '30 soniyada 5 ta misolni yeching',
    target: 5,
    energyCost: 1,
    rewardXp: 100,
    rewardEnergy: 0,
    timeLimit: 30,
  },
  streak: {
    type: 'streak',
    title: 'Seriya ustasi',
    description: "Ketma-ket 7 ta to'g'ri javob bering",
    target: 7,
    energyCost: 2,
    rewardXp: 200,
    rewardEnergy: 1,
    timeLimit: 60,
  },
  accuracy: {
    type: 'accuracy',
    title: 'Mukammal aniqlik',
    description: "10 ta misolda 90%+ aniqlik",
    target: 10,
    energyCost: 3,
    rewardXp: 350,
    rewardEnergy: 2,
    timeLimit: 90,
  },
};

// Mental arifmetika formula qoidalari
const FORMULA_RULES = {
  oddiy: {
    0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
    1: { add: [1, 2, 3, 5, 6, 7, 8], subtract: [1] },
    2: { add: [1, 2, 5, 6, 7], subtract: [1, 2] },
    3: { add: [1, 5, 6], subtract: [1, 2, 3] },
    4: { add: [5], subtract: [1, 2, 3, 4] },
    5: { add: [1, 2, 3, 4], subtract: [5] },
    6: { add: [1, 2, 3], subtract: [1, 5, 6] },
    7: { add: [1, 2], subtract: [1, 2, 5, 7] },
    8: { add: [1], subtract: [1, 2, 3, 5, 8] },
    9: { add: [], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  },
  formula5: {
    3: { add: [2], subtract: [] },
    4: { add: [1, 2], subtract: [] },
    5: { add: [], subtract: [1, 2] },
    6: { add: [], subtract: [2] },
  },
  formula10plus: {
    1: { add: [9], subtract: [] },
    2: { add: [8, 9], subtract: [] },
    3: { add: [7, 8, 9], subtract: [] },
    4: { add: [6, 7, 8, 9], subtract: [] },
    5: { add: [5, 6, 7, 8, 9], subtract: [] },
    6: { add: [4, 5, 6, 7, 8, 9], subtract: [] },
    7: { add: [3, 4, 5, 6, 7, 8, 9], subtract: [] },
    8: { add: [2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
    9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
  },
  hammasi: {
    0: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [] },
    1: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1] },
    2: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2] },
    3: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3] },
    4: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4] },
    5: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5] },
    6: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6] },
    7: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7] },
    8: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8] },
    9: { add: [1, 2, 3, 4, 5, 6, 7, 8, 9], subtract: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  },
};

// Mental arifmetika formulalari bo'yicha masala generatsiyasi
const generateMentalArithmeticProblem = (difficulty: number) => {
  // Qiyinlik darajasiga qarab formula tanlash
  const formulas = ['oddiy', 'formula5', 'formula10plus', 'hammasi'] as const;
  const formulaIndex = Math.min(difficulty - 1, formulas.length - 1);
  const selectedFormula = formulas[formulaIndex];
  const rules = FORMULA_RULES[selectedFormula];
  
  // Boshlang'ich son tanlash (formula qoidalariga mos)
  const validStarts = Object.keys(rules).map(Number).filter(n => {
    const rule = rules[n as keyof typeof rules];
    return rule && (rule.add.length > 0 || rule.subtract.length > 0);
  });
  
  if (validStarts.length === 0) {
    return { question: '5 + 3', answer: 8 };
  }
  
  const startNum = validStarts[Math.floor(Math.random() * validStarts.length)];
  const rule = rules[startNum as keyof typeof rules];
  
  // Qo'shish yoki ayirish operatsiyasi
  const canAdd = rule.add.length > 0;
  const canSubtract = rule.subtract.length > 0;
  
  let operator: '+' | '-';
  let operand: number;
  
  if (canAdd && canSubtract) {
    operator = Math.random() > 0.5 ? '+' : '-';
  } else if (canAdd) {
    operator = '+';
  } else {
    operator = '-';
  }
  
  if (operator === '+') {
    operand = rule.add[Math.floor(Math.random() * rule.add.length)];
  } else {
    operand = rule.subtract[Math.floor(Math.random() * rule.subtract.length)];
  }
  
  const answer = operator === '+' ? startNum + operand : startNum - operand;
  
  return { 
    question: `${startNum} ${operator} ${operand}`, 
    answer 
  };
};

export const BonusChallenge = ({ energy, maxEnergy, onComplete, onEnergyUse }: BonusChallengeProps) => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [timeUntilAvailable, setTimeUntilAvailable] = useState<string>('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<{ question: string; answer: number } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');

  // Check bonus availability
  const checkAvailability = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_gamification')
      .select('bonus_cooldown_until')
      .eq('user_id', user.id)
      .single();

    if (!data?.bonus_cooldown_until) {
      setIsAvailable(true);
      setCooldownEnd(null);
      return;
    }

    const cooldown = new Date(data.bonus_cooldown_until);
    if (new Date() > cooldown) {
      setIsAvailable(true);
      setCooldownEnd(null);
    } else {
      setIsAvailable(false);
      setCooldownEnd(cooldown);
    }
  }, [user]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownEnd) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = cooldownEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setIsAvailable(true);
        setCooldownEnd(null);
        setTimeUntilAvailable('');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilAvailable(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // Game timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endChallenge(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const startChallenge = async (challenge: Challenge) => {
    if (energy < challenge.energyCost) {
      toast.error(`Yetarli energiya yo'q! ${challenge.energyCost} energiya kerak.`);
      return;
    }

    const success = await onEnergyUse(challenge.energyCost);
    if (!success) return;

    setSelectedChallenge(challenge);
    setIsPlaying(true);
    setTimeLeft(challenge.timeLimit);
    setProgress(0);
    setCurrentStreak(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setCurrentProblem(generateMentalArithmeticProblem(2));
    setUserAnswer('');
  };

  const endChallenge = (completed: boolean) => {
    setIsPlaying(false);
    
    if (!selectedChallenge) return;

    if (completed) {
      onComplete(selectedChallenge.rewardXp, selectedChallenge.rewardEnergy);
      toast.success(`Challenge bajarildi! +${selectedChallenge.rewardXp} XP`);
    } else {
      toast.error('Challenge muvaffaqiyatsiz tugadi');
    }

    setSelectedChallenge(null);
    checkAvailability();
  };

  const handleAnswer = () => {
    if (!currentProblem || !selectedChallenge) return;

    const isCorrect = parseInt(userAnswer) === currentProblem.answer;
    setTotalAnswers(prev => prev + 1);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);

      // Check win conditions based on challenge type
      let newProgress = 0;
      
      switch (selectedChallenge.type) {
        case 'speed':
          newProgress = ((correctAnswers + 1) / selectedChallenge.target) * 100;
          if (correctAnswers + 1 >= selectedChallenge.target) {
            endChallenge(true);
            return;
          }
          break;
        case 'streak':
          newProgress = ((currentStreak + 1) / selectedChallenge.target) * 100;
          if (currentStreak + 1 >= selectedChallenge.target) {
            endChallenge(true);
            return;
          }
          break;
        case 'accuracy':
          newProgress = ((totalAnswers + 1) / selectedChallenge.target) * 100;
          if (totalAnswers + 1 >= selectedChallenge.target) {
            const accuracy = ((correctAnswers + 1) / (totalAnswers + 1)) * 100;
            if (accuracy >= 90) {
              endChallenge(true);
            } else {
              endChallenge(false);
            }
            return;
          }
          break;
      }

      setProgress(newProgress);
    } else {
      // For streak challenge, wrong answer resets progress
      if (selectedChallenge.type === 'streak') {
        setCurrentStreak(0);
        setProgress(0);
      }
    }

    // Generate next problem
    setCurrentProblem(generateMentalArithmeticProblem(2));
    setUserAnswer('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnswer();
    }
  };

  if (!user) return null;

  // Playing state
  if (isPlaying && selectedChallenge && currentProblem) {
    return (
      <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-accent/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-warning" />
              {selectedChallenge.title}
            </span>
            <Badge variant="outline" className="text-warning border-warning/50">
              <Timer className="h-3 w-3 mr-1" />
              {timeLeft}s
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="text-center space-y-4">
            <p className="text-3xl font-display font-bold">{currentProblem.question} = ?</p>
            
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              className="w-32 text-center text-2xl font-bold p-3 rounded-xl border-2 border-border bg-background focus:border-primary outline-none"
              placeholder="?"
            />
            
            <Button onClick={handleAnswer} className="w-full">
              Tasdiqlash
            </Button>
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>To'g'ri: {correctAnswers}</span>
            {selectedChallenge.type === 'streak' && (
              <span>Seriya: {currentStreak}/{selectedChallenge.target}</span>
            )}
            {selectedChallenge.type === 'accuracy' && (
              <span>Aniqlik: {totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0}%</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gift className="h-5 w-5 text-warning" />
          Bonus Challenge
          {isAvailable && (
            <Sparkles className="h-4 w-4 text-warning animate-pulse" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Energy display */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
          <span className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            Energiya
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxEnergy }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-6 rounded-full transition-all',
                  i < energy
                    ? 'bg-warning shadow-sm shadow-warning/50'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        {!isAvailable && timeUntilAvailable ? (
          <div className="text-center py-6">
            <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Keyingi bonus</p>
            <p className="text-2xl font-display font-bold text-primary">{timeUntilAvailable}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Energiya sarflab qo'shimcha XP oling!</p>
            
            {Object.values(CHALLENGES).map((challenge) => (
              <button
                key={challenge.type}
                onClick={() => startChallenge(challenge)}
                disabled={energy < challenge.energyCost}
                className={cn(
                  'w-full p-4 rounded-xl border text-left transition-all',
                  energy >= challenge.energyCost
                    ? 'hover:border-warning/50 hover:bg-warning/5 border-border/50'
                    : 'opacity-50 cursor-not-allowed border-border/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {challenge.type === 'speed' && <Timer className="h-4 w-4 text-blue-500" />}
                      {challenge.type === 'streak' && <Trophy className="h-4 w-4 text-warning" />}
                      {challenge.type === 'accuracy' && <Star className="h-4 w-4 text-green-500" />}
                      <span className="font-semibold text-sm">{challenge.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      <Zap className="h-3 w-3 mr-1" />
                      {challenge.energyCost}
                    </Badge>
                    <p className="text-xs text-green-500 font-medium">+{challenge.rewardXp} XP</p>
                    {challenge.rewardEnergy > 0 && (
                      <p className="text-xs text-warning font-medium">+{challenge.rewardEnergy} ⚡</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
