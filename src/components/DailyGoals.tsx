import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Target, Check, ChevronUp, ChevronDown, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DailyGoalsProps {
  userId: string;
  dailyGoal: number;
  todaySolved: number;
  currentStreak: number;
  onGoalChange?: (newGoal: number) => void;
}

export const DailyGoals = ({
  userId,
  dailyGoal,
  todaySolved,
  currentStreak,
  onGoalChange,
}: DailyGoalsProps) => {
  const [goal, setGoal] = useState(dailyGoal);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const progress = Math.min((todaySolved / goal) * 100, 100);
  const isCompleted = todaySolved >= goal;

  const adjustGoal = (delta: number) => {
    const newGoal = Math.max(5, Math.min(100, goal + delta));
    setGoal(newGoal);
  };

  const saveGoal = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ daily_goal: goal })
      .eq('user_id', userId);

    if (error) {
      toast.error("Maqsad saqlanmadi");
    } else {
      toast.success("Kunlik maqsad yangilandi!");
      onGoalChange?.(goal);
      setIsEditing(false);
    }
    setSaving(false);
  };

  return (
    <Card className="border-border/40 shadow-sm overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Kunlik maqsad
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Progress Section */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Bugungi progress</span>
              <span className="text-sm font-semibold">
                {todaySolved} / {goal}
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-secondary"
            />
            {isCompleted && (
              <div className="absolute -right-1 -top-1 bg-success rounded-full p-1 shadow-md animate-celebrate">
                <Check className="h-3 w-3 text-success-foreground" />
              </div>
            )}
          </div>

          {/* Status */}
          <div className={`flex items-center justify-center gap-3 p-3 rounded-xl ${
            isCompleted 
              ? 'bg-success/10 text-success' 
              : 'bg-secondary/50 text-muted-foreground'
          }`}>
            {isCompleted ? (
              <>
                <Check className="h-5 w-5" />
                <span className="font-semibold">Kunlik maqsad bajarildi! 🎉</span>
              </>
            ) : (
              <span className="text-sm">
                Yana <span className="font-bold text-foreground">{goal - todaySolved}</span> ta misol yechish kerak
              </span>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-warning/10">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium">Kunlik seriya</span>
            </div>
            <span className="text-lg font-display font-bold text-warning">
              {currentStreak} kun
            </span>
          </div>

          {/* Goal Adjustment */}
          {isEditing ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => adjustGoal(-5)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <span className="text-xl font-display font-bold min-w-[3rem] text-center">
                  {goal}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => adjustGoal(5)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGoal(dailyGoal);
                    setIsEditing(false);
                  }}
                >
                  Bekor
                </Button>
                <Button
                  size="sm"
                  onClick={saveGoal}
                  disabled={saving}
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setIsEditing(true)}
            >
              Maqsadni o'zgartirish
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
