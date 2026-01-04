import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type TaskType = 'problems_solved' | 'streak' | 'level_completed' | 'coins_earned';

export const useTaskProgress = () => {
  const { user } = useAuth();

  const updateTaskProgress = useCallback(async (
    taskType: TaskType,
    amount: number = 1
  ) => {
    if (!user) return;

    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];

      // Get relevant tasks based on task type
      const { data: tasks } = await supabase
        .from('game_tasks')
        .select('*')
        .eq('is_active', true);

      if (!tasks) return;

      // Map task type to task titles
      const taskMapping: Record<TaskType, string[]> = {
        problems_solved: ['masala yech', 'masala yeching'],
        streak: ['streak', 'ketma-ket'],
        level_completed: ['level yakunla', 'levelni yakunlang'],
        coins_earned: ['coin yig', 'coin yig\'']
      };

      const relevantTitles = taskMapping[taskType];
      const relevantTasks = tasks.filter(t => 
        relevantTitles.some(title => t.title.toLowerCase().includes(title))
      );

      for (const task of relevantTasks) {
        // Get or create progress for this task
        const resetDate = task.task_type === 'daily' ? today : weekStart;
        
        const { data: existingProgress } = await supabase
          .from('user_task_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('task_id', task.id)
          .maybeSingle();

        if (existingProgress) {
          // Check if needs reset
          const needsReset = task.task_type === 'daily' 
            ? existingProgress.reset_date !== today
            : getWeekStart(new Date(existingProgress.reset_date)).toISOString().split('T')[0] !== weekStart;

          if (needsReset) {
            // Reset and update
            const newValue = Math.min(amount, task.target_value);
            await supabase
              .from('user_task_progress')
              .update({
                current_value: newValue,
                is_completed: newValue >= task.target_value,
                completed_at: newValue >= task.target_value ? new Date().toISOString() : null,
                reset_date: resetDate
              })
              .eq('id', existingProgress.id);
          } else if (!existingProgress.is_completed) {
            // Update existing progress
            const newValue = Math.min(existingProgress.current_value + amount, task.target_value);
            const isCompleted = newValue >= task.target_value;
            
            await supabase
              .from('user_task_progress')
              .update({
                current_value: newValue,
                is_completed: isCompleted,
                completed_at: isCompleted ? new Date().toISOString() : null
              })
              .eq('id', existingProgress.id);
          }
        } else {
          // Create new progress
          const newValue = Math.min(amount, task.target_value);
          await supabase
            .from('user_task_progress')
            .insert({
              user_id: user.id,
              task_id: task.id,
              current_value: newValue,
              is_completed: newValue >= task.target_value,
              completed_at: newValue >= task.target_value ? new Date().toISOString() : null,
              reset_date: resetDate
            });
        }
      }
    } catch (error) {
      console.error('Error updating task progress:', error);
    }
  }, [user]);

  return { updateTaskProgress };
};

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default useTaskProgress;
