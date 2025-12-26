import { Difficulty, getDifficultyLabel } from '@/lib/mathGenerator';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export const DifficultyPicker = ({ value, onChange }: DifficultyPickerProps) => {
  const difficulties: Difficulty[] = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {difficulties.map((level) => (
        <Button
          key={level}
          variant={value === level ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onChange(level)}
          className={cn(
            'min-w-[80px] transition-all',
            value === level && 'shadow-glow'
          )}
        >
          {getDifficultyLabel(level)}
        </Button>
      ))}
    </div>
  );
};
