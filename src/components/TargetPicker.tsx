import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TargetPickerProps {
  value: number;
  onChange: (target: number) => void;
}

const targetOptions = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 0, label: '∞' },
];

export const TargetPicker = ({ value, onChange }: TargetPickerProps) => {
  return (
    <div className="flex gap-2 justify-center">
      {targetOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'secondary'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'min-w-[50px] transition-all',
            value === option.value && 'shadow-glow'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
