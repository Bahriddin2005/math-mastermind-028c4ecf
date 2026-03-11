import { useState, useCallback, useRef, useEffect } from 'react';
import { MathProblem, MathSection, Difficulty, GameStats, MentalMathGenerator } from '@/lib/mathGenerator';

export type GameMode = 'practice' | 'timer';

interface UseGameStateOptions {
  section: MathSection;
  difficulty: Difficulty;
  mode: GameMode;
  timerDuration?: number;
  targetProblems?: number;
  onCorrect?: () => void;
  onIncorrect?: () => void;
  onComplete?: () => void;
  onStreakMilestone?: (streak: number) => void;
}

export const useGameState = (options: UseGameStateOptions) => {
  const { 
    section, 
    difficulty, 
    mode, 
    timerDuration = 60, 
    targetProblems = 0,
    onCorrect, 
    onIncorrect, 
    onComplete,
    onStreakMilestone 
  } = options;

  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    incorrect: 0,
    streak: 0,
    bestStreak: 0,
    totalTime: 0,
    problems: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const problemStartRef = useRef<number>(0);
  const lastStreakRef = useRef<number>(0);

  const generateNewProblem = useCallback(() => {
    const problem = MentalMathGenerator.generate(section, difficulty);
    setCurrentProblem(problem);
    setUserAnswer('');
    setFeedback(null);
    problemStartRef.current = Date.now();
  }, [section, difficulty]);

  const startGame = useCallback(() => {
    setIsGameActive(true);
    setTimeLeft(timerDuration);
    setStats({
      correct: 0,
      incorrect: 0,
      streak: 0,
      bestStreak: 0,
      totalTime: 0,
      problems: 0,
    });
    lastStreakRef.current = 0;
    generateNewProblem();
  }, [timerDuration, generateNewProblem]);

  const endGame = useCallback(() => {
    setIsGameActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onComplete?.();
  }, [onComplete]);

  const checkAnswer = useCallback(() => {
    if (!currentProblem || userAnswer === '') return;

    const userNum = parseInt(userAnswer, 10);
    const isCorrect = userNum === currentProblem.answer;
    const problemTime = (Date.now() - problemStartRef.current) / 1000;

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newBestStreak = Math.max(prev.bestStreak, newStreak);
      
      // Check for streak milestone
      if (isCorrect && newStreak >= 5 && (newStreak === 5 || newStreak % 5 === 0)) {
        onStreakMilestone?.(newStreak);
      }
      
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        streak: newStreak,
        bestStreak: newBestStreak,
        totalTime: prev.totalTime + problemTime,
        problems: prev.problems + 1,
      };
    });

    if (isCorrect) {
      onCorrect?.();
    } else {
      onIncorrect?.();
    }

    // Show feedback then move to next problem
    setTimeout(() => {
      if (isGameActive) {
        // Check if target reached (practice mode with target)
        if (mode === 'practice' && targetProblems > 0) {
          const newProblems = stats.problems + 1;
          if (newProblems >= targetProblems) {
            endGame();
            return;
          }
        }
        generateNewProblem();
      }
    }, isCorrect ? 500 : 1500);
  }, [currentProblem, userAnswer, isGameActive, generateNewProblem, onCorrect, onIncorrect, onStreakMilestone, mode, targetProblems, stats.problems, endGame]);

  // Timer logic
  useEffect(() => {
    if (mode === 'timer' && isGameActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [mode, isGameActive, endGame]);

  const skipProblem = useCallback(() => {
    setStats(prev => ({
      ...prev,
      incorrect: prev.incorrect + 1,
      streak: 0,
    }));
    generateNewProblem();
  }, [generateNewProblem]);

  return {
    currentProblem,
    userAnswer,
    setUserAnswer,
    feedback,
    isGameActive,
    timeLeft,
    stats,
    startGame,
    endGame,
    checkAnswer,
    skipProblem,
    generateNewProblem,
  };
};
