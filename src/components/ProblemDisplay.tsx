import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MathProblem } from '@/lib/mathGenerator';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ArrowRight, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemDisplayProps {
  problem: MathProblem | null;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  feedback: 'correct' | 'incorrect' | null;
  disabled?: boolean;
}

export const ProblemDisplay = ({
  problem,
  userAnswer,
  onAnswerChange,
  onSubmit,
  onSkip,
  feedback,
  disabled,
}: ProblemDisplayProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [problem, disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userAnswer !== '') {
      onSubmit();
    }
  };

  if (!problem) {
    return (
      <Card variant="game" className="p-8 md:p-12 text-center">
        <p className="text-xl text-muted-foreground">
          Bo'limni tanlang va mashqni boshlang
        </p>
      </Card>
    );
  }

  return (
    <Card
      variant="game"
      className={cn(
        'p-8 md:p-12 transition-all duration-300',
        feedback === 'correct' && 'animate-celebrate border-success shadow-glow',
        feedback === 'incorrect' && 'animate-shake border-destructive'
      )}
    >
      {/* Problem display */}
      <div className="text-center mb-8">
        <p className="text-4xl md:text-6xl font-display font-black tracking-wide">
          {problem.display}
        </p>
      </div>

      {/* Answer section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-md mx-auto">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-3xl font-bold text-muted-foreground">=</span>
          <Input
            ref={inputRef}
            type="number"
            variant="game"
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="?"
            disabled={disabled || feedback !== null}
            className={cn(
              'w-32 sm:w-40',
              feedback === 'correct' && 'border-success bg-success/10',
              feedback === 'incorrect' && 'border-destructive bg-destructive/10'
            )}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="game"
            size="xl"
            onClick={onSubmit}
            disabled={disabled || userAnswer === '' || feedback !== null}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="xl"
            onClick={onSkip}
            disabled={disabled || feedback !== null}
            title="O'tkazib yuborish"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className={cn(
          'mt-6 text-center animate-slide-up',
          feedback === 'correct' ? 'text-success' : 'text-destructive'
        )}>
          {feedback === 'correct' ? (
            <p className="text-2xl font-display font-bold">To'g'ri! 🎉</p>
          ) : (
            <p className="text-xl font-display">
              Javob: <span className="font-bold">{problem.answer}</span>
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
