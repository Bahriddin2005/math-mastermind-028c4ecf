import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TimerPickerProps {
  value: number;
  onChange: (duration: number) => void;
}

const timerOptions = [
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
];

export const TimerPicker = ({ value, onChange }: TimerPickerProps) => {
  return (
    <div className="flex gap-2 justify-center">
      {timerOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'accent' : 'secondary'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'min-w-[60px] transition-all',
            value === option.value && 'shadow-glow'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
