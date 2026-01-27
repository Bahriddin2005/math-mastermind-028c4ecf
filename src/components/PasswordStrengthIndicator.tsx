import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthLevel {
  label: string;
  color: string;
  bgColor: string;
  score: number;
}

const strengthLevels: StrengthLevel[] = [
  { label: "Juda zaif", color: "text-destructive", bgColor: "bg-destructive", score: 0 },
  { label: "Zaif", color: "text-orange-500", bgColor: "bg-orange-500", score: 1 },
  { label: "O'rtacha", color: "text-yellow-500", bgColor: "bg-yellow-500", score: 2 },
  { label: "Kuchli", color: "text-emerald-500", bgColor: "bg-emerald-500", score: 3 },
  { label: "Juda kuchli", color: "text-green-600", bgColor: "bg-green-600", score: 4 },
];

const requirements = [
  { label: "Kamida 6 ta belgi", test: (p: string) => p.length >= 6 },
  { label: "Katta harf (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Kichik harf (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Raqam (0-9)", test: (p: string) => /\d/.test(p) },
  { label: "Maxsus belgi (!@#$)", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const { strength, passedRequirements } = useMemo(() => {
    const passed = requirements.filter(req => req.test(password));
    const score = Math.min(passed.length, 4);
    return {
      strength: strengthLevels[score],
      passedRequirements: passed.map(r => r.label),
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index <= strength.score - 1 ? strength.bgColor : "bg-muted"
            )}
          />
        ))}
      </div>
      
      {/* Strength label */}
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium transition-colors", strength.color)}>
          {strength.label}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.label}
              className={cn(
                "flex items-center gap-1.5 text-[10px] sm:text-xs transition-colors",
                passed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
